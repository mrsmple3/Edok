import { getMessageByRoom } from '~/server/db/message';

export default defineEventHandler(async (event) => {
    try {

        const { room } = event.context.params;

        const messages = await getMessageByRoom(room);

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
