import { getAllLeads } from "~/server/db/leads";

export default defineEventHandler(async (event) => {
    try {
        const leads = await getAllLeads();

        return {
            code: 200,
            body: {
                leads
            }
        }
    } catch (error) {
        console.error("Error getting leads:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: { error: "Помилка при отриманні договору " + error }
        };
    }
});
