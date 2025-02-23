import {getCookie} from 'h3';
import {getRefreshTokenByToken} from "~/server/db/refreshTokens";
import {generateTokens} from "~/server/utils/jwt";
import {getUserById} from "~/server/db/users";

export default defineEventHandler(async (event) => {
    try {
        const refreshToken = getCookie(event, 'refreshToken');

        if (!refreshToken) {
            return {
                code: 400,
                body: {
                   error: 'Missing required fields'
                }
            };
        }

        const rToken = await getRefreshTokenByToken(refreshToken);
        if (!rToken) {
            return {
                code: 400,
                body: {
                    error: 'Токен не найден'
                }
            };
        }

        try {
            const user = await getUserById(rToken.userId);

            if (!user) {
                return {
                    code: 400,
                    body: {
                        error: 'Пользователь не найден'
                    }
                };
            }


            const {accessToken} = generateTokens(user);

            return {
                code: 200,
                body: {
                    token: accessToken
                }
            };
        } catch (error) {
            return {
                code: 200,
                body: {
                    error: 'Токен не найден'
                }
            };
        }
    } catch (error) {
        return {
            code: 500,
            error: 'Ошибка обновления токена: ' + error
        };
    }
});