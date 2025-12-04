import { defineEventHandler, readFormData } from "h3";
import { prisma } from "~/server/db";
import { createSign } from "~/server/db/sign";
import { createFile, updateDocument } from "~/server/db/document";
import { extractP7sInfo } from "../../db/extractP7sInfo";
import { promises as fs } from "fs";
import path from "path";
import { addVisibleStamp } from "~/server/utils/addVisibleStamp"

const MAX_SIGNATURES_PER_ORGANIZATION = 2;

function decodeHexString(hexStr?: string | null): string {
  if (!hexStr) return '';

  const cleaned = hexStr.replace(/\\x([0-9A-Fa-f]{2})/g, (_match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  if (hexStr.includes('\\x')) {
    try {
      const bytes = new Uint8Array([...cleaned].map((char) => char.charCodeAt(0)));
      return new TextDecoder('utf-8').decode(bytes);
    } catch (error) {
      console.warn('Не вдалося декодувати UTF-8 значення сертифіката', error);
      return cleaned;
    }
  }

  return cleaned;
}

function normalizeOrganizationName(name?: string | null) {
  if (!name) return '';
  return name.replace(/\s+/g, ' ').trim().toLowerCase();
}

function extractOrganizationNameFromCertInfo(certInfo?: string | null) {
  if (!certInfo || typeof certInfo !== 'string') {
    return '';
  }

  const subjectMatch = certInfo.match(/Subject:\s*(.+?)(?:\n|$)/s);
  if (!subjectMatch) {
    return '';
  }

  const subject = subjectMatch[1];
  const cnMatch = subject.match(/CN=([^,\n]+)/);
  const oMatch = subject.match(/O=([^,\n]+)/i);

  const decodedCn = cnMatch ? decodeHexString(cnMatch[1]).trim() : '';
  const decodedO = oMatch ? decodeHexString(oMatch[1]).trim() : '';

  const organizationKeywords = /(ТОВ|ООО|ПП|ФОП)/i;
  if (decodedCn && organizationKeywords.test(decodedCn)) {
    return decodedCn;
  }

  if (decodedO && decodedO !== 'ФІЗИЧНА ОСОБА') {
    return decodedO;
  }

  return decodedCn || decodedO;
}

function buildOrganizationCountMap(signatures: Array<{ info: string | null }>) {
  const counts = new Map<string, number>();
  signatures.forEach((signature) => {
    if (!signature?.info) return;
    const organizationName = extractOrganizationNameFromCertInfo(signature.info);
    const normalized = normalizeOrganizationName(organizationName);
    if (!normalized) return;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  });
  return counts;
}

export default defineEventHandler(async (event) => {
  try {
    // Чтение данных из тела запроса
    const formData = await readFormData(event);

    const userId = Number(formData.get("userId") as string);
    const documentId = Number(formData.get("documentId") as string);
    const signature = formData.get("signature") as File;
    const originalPdfFile = formData.get("finalPdfFile") as File;

    // НОВОЕ: Получаем готовую certInfo из клиента
    const certInfoString = formData.get("certInfo") as string;
    const clientCertInfo = certInfoString ? JSON.parse(certInfoString) : null;

    const stampDataString = formData.get("stampData") as string;
    const stampData = stampDataString ? JSON.parse(stampDataString) : null;


    // Проверка обязательных полей
    if (!userId || !documentId) {
      event.res.statusCode = 400;
      return {
        code: 400,
        body: {
          error: "Необхідно вказати всі обов'язкові поля: userId, id",
        },
      };
    }



    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      event.res.statusCode = 404;
      return {
        code: 404,
        body: {
          error: "Документ із зазначеним id не знайдено",
        },
      };
    }

    const creatingFile = await createFile(event, signature);
    console.log('Результат создания файла подписи:', creatingFile);

    if (creatingFile.status !== 200) {
      event.res.statusCode = creatingFile.status;
      return creatingFile;
    }

    const existingSignatures = await prisma.signature.findMany({
      where: { documentId: documentId },
      select: { info: true }
    });
    const existingSignsCount = existingSignatures.length;

    let resolvedCertInfo = typeof clientCertInfo === 'string' ? clientCertInfo : null;

    if (!resolvedCertInfo) {
      try {
        const buffer = Buffer.from(await signature.arrayBuffer());
        const tempPath = path.resolve("/tmp", `${Date.now()}-${signature.name}`);
        await fs.writeFile(tempPath, buffer);
        resolvedCertInfo = await extractP7sInfo(tempPath).catch(() => null);
        await fs.unlink(tempPath);
      } catch (certError) {
        console.error('Не вдалося отримати інформацію про сертифікат:', certError);
      }
    }

    const currentOrganizationName = extractOrganizationNameFromCertInfo(resolvedCertInfo);
    const normalizedCurrentOrganization = normalizeOrganizationName(currentOrganizationName);
    const existingOrgCounts = buildOrganizationCountMap(existingSignatures);
    const currentOrgSignCount = normalizedCurrentOrganization ? (existingOrgCounts.get(normalizedCurrentOrganization) || 0) : 0;

    if (normalizedCurrentOrganization && currentOrgSignCount >= MAX_SIGNATURES_PER_ORGANIZATION) {
      const displayName = currentOrganizationName || 'Невідомо';
      event.res.statusCode = 400;
      return {
        code: 400,
        body: {
          error: `Організація "${displayName}" вже підписувала документ ${MAX_SIGNATURES_PER_ORGANIZATION} рази.`
        }
      };
    }

    // Добавляем печать к PDF НА СЕРВЕРЕ
    let finalPdfFile = originalPdfFile;
    if (stampData) {
      try {
        const originalArrayBuffer = await originalPdfFile.arrayBuffer();

        // Подготавливаем данные для печати с счетчиком
        const stampDataWithCount = {
          ...stampData,
          stampCount: existingSignsCount // Количество существующих печатей
        };

        console.log('Добавляем печать с данными:', stampDataWithCount);

        const finalPdfBytes = await addVisibleStamp(originalArrayBuffer, stampDataWithCount);
        const finalPdfBlob = new Blob([finalPdfBytes], { type: "application/pdf" });
        finalPdfFile = new File([finalPdfBlob], originalPdfFile.name, { type: "application/pdf" });

        console.log('Печать успешно добавлена на сервере');

      } catch (stampError) {
        console.error('Ошибка добавления печати на сервере:', stampError);
        // Используем оригинальный файл если печать не удалось добавить
      }
    }


    const creatingFileSignedPdfFile = await createFile(event, finalPdfFile);
    console.log('Результат создания PDF файла:', creatingFileSignedPdfFile);

    // Сохранение сообщения в базе данных
    const sign = await createSign({
      signature: creatingFile.body.fileUrl,
      documentId,
      userId,
      certInfo: resolvedCertInfo,
      stampedFile: creatingFileSignedPdfFile.body.fileUrl,
    });

    console.log('Созданная подпись в БД:', sign);

    await updateDocument(document.id, { status: 'Підписано' });

    return {
      code: 201,
      body: {
        sign,
        certInfo: resolvedCertInfo
      },
    };
  } catch (error: any) {
    console.error("Error creating sign:", error);
    event.res.statusCode = 500;
    return {
      code: 500,
      body: {
        error: "Помилка під час створення підпису: " + error.message,
      },
    };
  }
});
