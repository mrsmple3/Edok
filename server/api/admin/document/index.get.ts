import { defineEventHandler, getQuery } from "h3";
import { getAllDocuments, getDocumentsPaginated } from "~/server/db/document";
import { getUserById } from "~/server/db/users";

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);

        // Если запрос с пагинацией
        if (query.page && query.limit) {
            const page = parseInt(query.page as string);
            const limit = parseInt(query.limit as string);
            const sortBy = (query.sortBy as string) || 'createdAt';
            const sortOrder = (query.sortOrder as 'asc' | 'desc') || 'desc';
            const userId = query.userId ? parseInt(query.userId as string) : undefined;
            const leadId = query.leadId ? parseInt(query.leadId as string) : undefined;

            // Получаем роль пользователя если передан userId
            let userRole = undefined;
            if (userId) {
                const user = await getUserById(userId);
                userRole = user?.role;
            }

            const result = await getDocumentsPaginated({
                page,
                limit,
                sortBy,
                sortOrder,
                userId,
                leadId,
                userRole,
            });

            return {
                code: 200,
                body: result,
            };
        }

        // Старый способ - все документы сразу (для обратной совместимости)
        const documents = await getAllDocuments();

        return {
            code: 200,
            body: { documents },
        };
    } catch (error) {
        console.error("Error getting documents:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: { error: "Ошибка при получение документов " + error }
        };
    }
});
