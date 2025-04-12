import { getDocumentsByLead, getDocumentsByUserId } from "~/server/db/document";
import { getLeadsByAuthorId, getLeadsByRole } from "~/server/db/leads";
import { getUserById } from "~/server/db/users";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params;

    try {

        const user = await getUserById(parseInt(id));

        if (!user) {
            event.res.statusCode = 404;
            return {
                code: 404,
                body: {
                    error: "Пользователь не найден",
                },
            };
        }

        const leads = await getLeadsByRole(user.role, user.id);

        return {
            code: 200,
            body: {
                leads
            }
        }
    } catch (error) {
        console.error("Error getting user leads:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: { error: "Ошибка при получения лидов юзера " + error }
        };
    }
});
