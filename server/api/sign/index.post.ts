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
    const finalPdfFile = formData.get("finalPdfFile") as File;

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

    if (creatingFile.status !== 200) {
      event.res.statusCode = creatingFile.status;
      return creatingFile;
    }

    // Временное сохранение файла подписи на диск для анализа
    const buffer = Buffer.from(await signature.arrayBuffer());
    const tempPath = path.resolve("/tmp", `${Date.now()}-${signature.name}`);
    await fs.writeFile(tempPath, buffer);

    // Парсинг подписи
    const certInfo = await extractP7sInfo(tempPath).catch(() => null);
    await fs.unlink(tempPath);

    const creatingFileSignedPdfFile = await createFile(event, finalPdfFile);

    // Сохранение сообщения в базе данных
    const sign = await createSign({
      signature: creatingFile.body.fileUrl,
      documentId,
      userId,
      certInfo,
      stampedFile: creatingFileSignedPdfFile.body.fileUrl,
    });

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
