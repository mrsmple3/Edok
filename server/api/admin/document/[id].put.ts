import {getDocumentById, updateDocument} from "~/server/db/document";

export default defineEventHandler(async (event) => {
    try {
        const { id } = event.context.params;
        const body = await readBody(event);

        return await updateDocument(parseInt(id), body);
    } catch(error) {
        console.error("Error updating document:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: { error: "Ошибка при обновлении документа " + error }
        };
    }
});