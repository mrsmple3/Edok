import { defineEventHandler, readFormData } from "h3";
import { prisma } from "~/server/db";
import { createSign } from "~/server/db/sign";
import { createFile, updateDocument } from "~/server/db/document";
import { extractP7sInfo } from "../../db/extractP7sInfo";
import { promises as fs } from "fs";
import path from "path";

export default defineEventHandler(async (event) => {
  try {
    // Чтение данных из тела запроса
    const formData = await readFormData(event);

    const userId = Number(formData.get("userId") as string);
    const documentId = Number(formData.get("documentId") as string);
    const signature = formData.get("signature") as File;

    // Проверка обязательных полей
    if (!userId || !documentId) {
      event.res.statusCode = 400;
      return {
        code: 400,
        body: {
          error: "Необходимо указать все обязательные поля: userId, id",
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
          error: "Документ с указанным id не найден",
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

    console.log(certInfo);

    // Сохранение сообщения в базе данных
    const sign = await createSign({
      signature: creatingFile.body.fileUrl,
      documentId,
      userId,
      certInfo
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
        error: "Ошибка при создании подписи: " + error.message,
      },
    };
  }
});
