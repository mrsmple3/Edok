import {updateUserRole} from "~/server/db/users";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params;
    const { role } = await readBody(event);

    try {
        const user = await updateUserRole(parseInt(id), role);

        return {
            code: 200,
            body: { user },
        };
    } catch (error) {
        console.error("Error updating user role:", error);
        event.res.statusCode = 500;
        return {
            code: 500,
            body: { error: "Ошибка при обновлении роли пользователя " + error }
        };
    }
});