import {getUserById} from "~/server/db/users";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params;

    const user = await getUserById(parseInt(id));

    if(!user) {
        event.res.statusCode = 404;
        return {
            code: 404,
            body: {
                error: "Пользователь не найден"
            }
        }
    }

    return {
        code: 200,
        body: {
            user
        }
    }
})