import { defineEventHandler } from "h3";
import {getAllDocuments} from "~/server/db/document";

export default defineEventHandler(async (event) => {
    try {
        const document = await getAllDocuments();

        if (document.length === 0) {
            event.res.statusCode = 404;
            return {
                code: 404,
                body: { error: "Документы не найдены" },
            };
        }

        return {
            code: 200,
            body: { document },
        };
    } catch (error) {
        console.error("Error getting leads:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: { error: "Ошибка при получение лидов " + error }
        };
    }
});