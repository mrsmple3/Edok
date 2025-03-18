import {updateUser, updateUserRole} from "~/server/db/users";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params;
    const body = await readBody(event);

    //check required fields

    try {
        const user = await updateUser(parseInt(id), body);

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