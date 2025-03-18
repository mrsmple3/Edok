import {getDocumentsByLead} from "~/server/db/document";
import {updateLead} from "~/server/db/leads";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params;
    const body = await readBody(event);

    try {
        const document = await updateLead(parseInt(id), body);

        return {
            code: 200,
            body: {
                document
            }
        }
    } catch(error) {
        console.error("Error updating lead", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: { error: "Ошибка при обновлении лида " + error }
        };
    }
});