import { defineEventHandler, readFormData } from "h3";
import { prisma } from "~/server/db";
import { createSign } from "~/server/db/sign";
import { createFile, updateDocument } from "~/server/db/document";
import { extractP7sInfo } from "../../db/extractP7sInfo";
import { promises as fs } from "fs";
import path from "path";
import { addVisibleStamp } from "~/server/utils/addVisibleStamp"

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
    const certInfo = certInfoString ? JSON.parse(certInfoString) : null;

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

    // // Временное сохранение файла подписи на диск для анализа
    // const buffer = Buffer.from(await signature.arrayBuffer());
    // const tempPath = path.resolve("/tmp", `${Date.now()}-${signature.name}`);
    // await fs.writeFile(tempPath, buffer);

    // // Парсинг подписи
    // const certInfo = await extractP7sInfo(tempPath).catch(() => null);
    // await fs.unlink(tempPath);

    // Подсчитываем существующие подписи для этого документа
    const existingSignsCount = await prisma.signature.count({
      where: { documentId: documentId }
    });

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
      certInfo,
      stampedFile: creatingFileSignedPdfFile.body.fileUrl,
    });

    console.log('Созданная подпись в БД:', sign);

    await updateDocument(document.id, { status: 'Підписано' });

    return {
      code: 201,
      body: {
        sign,
        certInfo
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
