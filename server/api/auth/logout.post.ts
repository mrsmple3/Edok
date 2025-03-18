import { getCookie } from "h3";
import { removeRefreshToken } from "~/server/db/refreshTokens";
import { sendRefreshToken } from "~/server/utils/jwt";

export default defineEventHandler(async (event) => {
	try {
		const refreshToken = getCookie(event, "refreshToken");
		const removedRefreshToken = await removeRefreshToken(refreshToken);
		
		if (!removedRefreshToken) {
			return {
				status: 400,
				body: { error: "Ошибка при выходе из аккаунта" },
			};
		}
		
		sendRefreshToken(event, null);
		
		return {
			status: 200,
			body: { message: "Вы успешно вышли из аккаунта" },
		};
	} catch (error: any) {
		return {
			status: 500,
			body: { error: "Ошибка при выходе из аккаунта " + error },
		};
	}
});
