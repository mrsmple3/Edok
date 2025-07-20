import { getDocumentsByLead } from "~/server/db/document";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params;

    try {
        const documents = await getDocumentsByLead(parseInt(id));

        return {
            code: 200,
            body: {
                documents
            }
        }
    } catch (error) {
        console.error("Error getting documents of lead:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: {
                error: "Помилка під час отримання документів договору  " + error
            }
        };
    }
});
