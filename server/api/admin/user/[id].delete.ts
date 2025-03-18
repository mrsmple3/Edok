import { deleteUserById } from '~/server/db/users';

export default defineEventHandler(async (event) => {
    const { id } = event.context.params;
    try {
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