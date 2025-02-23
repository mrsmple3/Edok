import {createUser} from "~/server/db/users";
import {userTransformer} from "~/server/transformers/user";
import {sendError} from "h3";
import {generateTokens, sendRefreshToken} from "~/server/utils/jwt";
import {createOrUpdateRefreshToken} from "~/server/db/refreshTokens";

export default defineEventHandler(async (event) => {
    try {
        const {name, email, phone, password_hash, role} = await readBody(event);

        if (!password_hash && !email || !phone) {
            return {
                code: '400',
                body: {
                    error: 'Необходимо указать email или телефон'
                }
            };
        }

        let userData = {
                email,
                phone,
                password_hash,
                role,
            };

        const user = await createUser(userData);

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

        };
    } catch (error: any) {
        return {
            code: 500,
            error: 'Ошибка регистрации: ' + error
        }
    }
});