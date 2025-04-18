import { defineEventHandler, readBody } from "h3";
import { prisma } from "~/server/db";
import { postMessage } from '../../db/message';

export default defineEventHandler(async (event) => {
  try {
    // Чтение данных из тела запроса
    const body = await readBody(event);

    const { content, senderId, room } = body;

    // Проверка обязательных полей
    if (!content || !senderId || !room) {
      event.res.statusCode = 400;
      return {
        code: 400,
        body: {
          error: "Необходимо указать все обязательные поля: content, senderId, room",
        },
      };
    }

    // Проверка существования пользователя (отправителя)
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
    });

    if (!sender) {
      event.res.statusCode = 404;
      return {
        code: 404,
        body: {
          error: "Пользователь с указанным senderId не найден",
        },
      };
    }

    // Сохранение сообщения в базе данных
    const message = await postMessage({
      content,
      senderId,
      room,
    });

    return {
      code: 201,
      body: {
        message,
      },
    };
  } catch (error: any) {
    console.error("Error creating message:", error);
    event.res.statusCode = 500;
    return {
      code: 500,
      body: {
        error: "Ошибка при создании сообщения: " + error.message,
      },
    };
  }
});
