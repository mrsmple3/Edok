import { deleteDocumentById, getDocumentById, updateDocument } from "~/server/db/document";
import { prisma } from "~/server/db";

export default defineEventHandler(async (event) => {
    try {
        const { userId, documentId } = await readBody(event); // Получаем ID текущего пользователя из тела запроса

        const document = await getDocumentById(documentId);

        if (!document) {
            event.res.statusCode = 404;
            return {
                code: 404,
                body: { error: "Документ не знайдено" },
            };
        }

        // Проверяем, инициировал ли пользователь уже удаление
        const existingSign = await prisma.documentDeleteSign.findUnique({
            where: {
                documentId_userId: {
                    documentId: document.id,
                    userId: userId,
                },
            },
        });

        if (existingSign) {
            event.res.statusCode = 400;
            return {
                code: 400,
                body: {
                    error: "Користувач уже ініціював видалення документа"
                },
            };
        }

        // Добавляем запись о пользователе, инициировавшем удаление
        await prisma.documentDeleteSign.create({
            data: {
                documentId: document.id,
                userId: userId,
            },
        });

        // Увеличиваем счетчик удаления
        const deleteSignCount = document.deleteSignCount + 1;

        // Обновляем документ
        await updateDocument(document.id, { deleteSignCount });

        // Если счетчик удаления достиг 2, удаляем документ
        if (deleteSignCount === 2) {
            return await deleteDocumentById(event, documentId);
        }

        return {
            code: 200,
            body: {
                message: "Видалення підтверджено. Очікується підтвердження другого користувача."
            },
        };
    } catch (error) {
        console.error("Error deleting document:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: {
                error: "Помилка при видаленні документа " + error
            },
        };
    }
});
