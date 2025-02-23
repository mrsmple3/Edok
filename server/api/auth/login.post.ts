import {getUserByPhone, getUserByUsername} from "~/server/db/users";
import bcrypt from "bcrypt";
import {generateTokens, sendRefreshToken} from "~/server/utils/jwt";
import {userTransformer} from "~/server/transformers/user";
import {createOrUpdateRefreshToken} from "~/server/db/refreshTokens";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const {email, phone, password_hash} = body;

        if ((!email || !phone) && !password_hash) {
            event.res.statusCode = 400;
            return {
                code: 400,
                body: { error: 'Необходимо указать email или телефон' },
            }
        }

        // Is the user already registered?
        const user = email ? await getUserByUsername(email) : await getUserByPhone(phone);

        if (!user) {
            event.res.statusCode = 400;
            return {
                code: 400,
                body: { error: 'Пользователь не найден' },
            }
        }

        // Compare passwords
        const isPasswordCorrect = await bcrypt.compare(password_hash, user.password_hash);

        if (!isPasswordCorrect) {
            event.res.statusCode = 400;
            return {
                code: 400,
                body: { error: 'Неправильный пароль' },
            }
        }

        // Generate Tokens
        const {accessToken, refreshToken} = generateTokens(user);

        // Save it inside the database
        await createOrUpdateRefreshToken({
            token: refreshToken,
            userId: user.id
        });

        sendRefreshToken(event, refreshToken);

        return {
            code: 200,
            body: {
                access_token: accessToken,
                user: userTransformer(user)
            }
        }
    } catch (error: any) {
        event.res.statusCode = 500;
        return {
            code: 500,
            body: {
                error: 'Ошибка авторизации: ' + error
            }
        }
    }
});