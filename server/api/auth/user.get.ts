import {getUserById} from "~/server/db/users";
import {userTransformer} from "~/server/transformers/user";
import {decodeAccessToken} from "~/server/utils/jwt";
import {JwtPayload} from "jsonwebtoken";

export default defineEventHandler(async (event) => {
    const token = event.req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return {
            code: 400,
            body: {
                error:  'Токен не найден',
            }
        }
    }
    const decoded = decodeAccessToken(token) as JwtPayload;

    if (!decoded) {
        return {
            code: 400,
            body: {
                error: 'Ошибка декодирования токена',
            }
        }
    }

    try {
        const userId = decoded.userId;

        const user = await getUserById(userId);

        return {
            code: 200,
            body: {
                user: userTransformer(user)
            }
        };
    } catch (error) {
        return {
            code: 500,
            body: {
                error: 'Ошибка получения пользователя: ' + error
            }
        };
    }
})