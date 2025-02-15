import {createUser} from "~/server/db/users";
import {userTransformer} from "~/server/transformers/user";
import {sendError} from "h3";

export default defineEventHandler(async (event) => {
    try {
        const {name, email, phone, password, role} = await readBody(event);

        if (!password && !email || !phone) {
            return {message: 'Необходимо указать email или телефон'};
        }

        let userData = {
            email,
            phone,
            password,
            role,
        }

        const user = await createUser(userData);

        return userTransformer(user);
    } catch (error: any) {
        return sendError(event, createError({
            statusCode: 500,
            message: 'Ошибка создания пользователя: ' + error.message
        }));
    }
});