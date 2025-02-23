import {getCookie} from "h3";
import {removeRefreshToken} from "~/server/db/refreshTokens";
import {sendRefreshToken} from "~/server/utils/jwt";

export default defineEventHandler(async (event) => {
    try {
        const refreshToken = getCookie(event, 'refreshToken');
        await removeRefreshToken(refreshToken);
        sendRefreshToken(event, null);
        return {
            status: 200,
            body: {message: 'Вы успешно вышли из аккаунта'}
        };
    } catch (error: any) {
        throw new Error('Ошибка выхода из аккаунта: ' + error.message);
    }

})