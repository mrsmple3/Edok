import {getDocumentsByLead, getDocumentsByUserId} from "~/server/db/document";
import {getLeadsByAuthorId} from "~/server/db/leads";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params;

    try {
        const lead = await getLeadsByAuthorId(parseInt(id));

        return {
            code: 200,
            body: {
                lead
            }
        }
    } catch(error) {
        console.error("Error getting user leads:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: { error: "Ошибка при получения лидов юзера " + error }
        };
    }
});