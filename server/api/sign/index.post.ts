import { defineEventHandler, readBody } from "h3";
import { prisma } from "~/server/db";
import { postMessage } from '../../db/message';
import { createSign } from "~/server/db/sign";

export default defineEventHandler(async (event) => {
  try {
    // Чтение данных из тела запроса
    const body = await readBody(event);

    const { userId, documentId, signature } = body;

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

    // Сохранение сообщения в базе данных
    const sign = await createSign({
      signature,
      documentId,
      userId
    });

    return {
      code: 201,
      body: {
        sign,
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
