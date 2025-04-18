import { getUserById } from '~/server/db/users';
import { getBySenderIdMessage } from '../../db/message';

export default defineEventHandler(async (event) => {
    try {
        const { senderId } = event.context.params;

        const user = getUserById(parseInt(senderId));

        if (!user) {
            event.res.statusCode = 404;
            return {
                code: 404,
                body: { error: "User not found" }
            };
        }

        const messages = await getBySenderIdMessage(parseInt(senderId));

        return {
            code: 200,
            body: {
                messages
            }
        }
    } catch (error) {
        console.error("Error getting leads:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: { error: "Ошибка при получения лидов " + error }
        };
    }
});
