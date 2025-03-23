import {deleteDocuments} from "~/server/db/document";


export default defineEventHandler(async (event) => {
    try {
        await deleteDocuments();

        return {
            code: 200,
            body: { message: "Все докумнты успешно удалены" },
        };
    } catch (error) {
        console.error("Error deleting leads:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: { error: "Ошибка при удалении лидов " + error }
        };
    }
});