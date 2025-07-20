import { getLeadById } from "~/server/db/leads";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params;

    try {
        const lead = await getLeadById(parseInt(id));

        return {
            code: 200,
            body: {
                lead
            }
        }
    } catch (error) {
        console.error("Error getting lead:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: { error: "Помилка під час отримання договору " + error }
        };
    }
});
