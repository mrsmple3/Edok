import { deleteDocument, getDocumentsByUserId } from '~/server/db/document';
import { deleteLead, getLeadsByCounterpartyId, getLeadsByRole } from '~/server/db/leads';
import { deleteUserById, getUserById } from '~/server/db/users';

export default defineEventHandler(async (event) => {
    const { id } = event.context.params;
    try {

        const existUser = await getUserById(parseInt(id));

        if (!existUser) {
            event.res.statusCode = 404;
            return {
                code: 404,
                body: {
                    error: "Пользователь не найден "
                }
            }
        }

        const userLeads = await getLeadsByRole(existUser.role, parseInt(id));

        console.log(userLeads);


        if (userLeads.length > 0) {
            userLeads.forEach(async (lead) => {
                if (lead.documents.length > 0) {
                    lead.documents.forEach(async (doc) => {
                        await deleteDocument(doc.id);
                    });
                }
                await deleteLead(lead.id);
            })
        }

        const userDocuments = await getDocumentsByUserId(existUser.id);

        console.log(userDocuments);

        if (userDocuments.length > 0) {
            userDocuments.forEach(async (doc) => {
                await deleteDocument(doc.id);
            });
        }

        const deletedUser = await deleteUserById(parseInt(id));

        return {
            code: 200,
            body: {
                deletedUser
            }
        }
    } catch (error) {
        console.error("Error deleting user:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: {
                error: "Ошибка при удалении пользователя " + error
            }
        }
    }
});
