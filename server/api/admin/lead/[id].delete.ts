import { defineEventHandler } from "h3";
import { deleteDocuments } from "~/server/db/document";
import { deleteLead, deleteLeads, getLeadById } from "~/server/db/leads";

export default defineEventHandler(async (event) => {
    try {
        const { id } = event.context.params;

        const lead = await getLeadById(parseInt(id));

        const deletedLead = await deleteLead(parseInt(id));

        return {
            code: 200,
            body: { deletedLead },
        };
    } catch (error) {
        console.error("Error deleting lead:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: {
                error: "Помилка при видаленні договору " + error
            }
        };
    }
});

