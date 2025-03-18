import {updateDocumentStatusById} from "~/server/db/document";

export default defineEventHandler(async (event) => {
    try {
        const { id } = event.context.params;
        const { status } = await readBody(event);

        const document = await updateDocumentStatusById(parseInt(id), status);

        return {
            code: 200,
            body: {
                document
            }
        }
    } catch (error) {
        console.error("Error updating document status:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: { error: "Ошибка при обновлении статуса документа " + error }
        };
    }
});