import {deleteDocumentById} from "~/server/db/document";

export default defineEventHandler(async (event) => {
    try {
        const { id } = event.context.params;

        return await deleteDocumentById(event, id);
    } catch(error) {
        console.error("Error deleting document:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: { error: "Ошибка при удалении документа " + error }
        };
    }
});