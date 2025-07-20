import { defineEventHandler } from "h3";
import { deleteDocuments } from "~/server/db/document";
import { deleteLeads } from "~/server/db/leads";

export default defineEventHandler(async (event) => {
    try {
        const deletedLeads = await deleteLeads();

        return {
            code: 200,
            body: { deletedLeads },
        };
    } catch (error) {
        console.error("Error deleting leads:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: { error: "Помилка при видаленні договору " + error }
        };
    }
});

