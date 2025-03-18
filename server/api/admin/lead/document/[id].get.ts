import {getDocumentsByLead} from "~/server/db/document";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params;

    try {
        const document = await getDocumentsByLead(parseInt(id));

        return {
            code: 200,
            body: {
                document
            }
        }
    } catch(error) {
        console.error("Error getting documents of lead:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: { error: "Ошибка при получения документов лида " + error }
        };
    }
});