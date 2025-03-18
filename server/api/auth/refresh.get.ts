import { getCookie } from "h3";
import { getRefreshTokenByToken } from "~/server/db/refreshTokens";
import { generateTokens } from "~/server/utils/jwt";
import { getUserById } from "~/server/db/users";

export default defineEventHandler(async (event) => {
	try {
		const refreshToken = getCookie(event, "refreshToken");

		if (!refreshToken) {
			event.res.statusCode = 400;
			return {
				code: 400,
				body: {
					error: "Пропущен токен",
				},
			};
		}

		const rToken = await getRefreshTokenByToken(refreshToken);
		if (!rToken) {
			event.res.statusCode = 400;
			return {
				code: 400,
				body: {
					error: "Токен не найден",
				},
			};
		}

		try {
			const user = await getUserById(rToken.userId);

			if (!user) {
				event.res.statusCode = 400;
				return {
					code: 400,
					body: {
						error: "Пользователь не найден",
					},
				};
			}

			const { accessToken } = generateTokens(user);

			return {
				code: 200,
				body: {
					token: accessToken,
				},
			};
		} catch (error) {
			return {
				code: 200,
				body: {
					error: "Токен не найден",
				},
			};
		}
	} catch (error) {
		event.res.statusCode = 500;
		return {
			code: 500,
			error: "Ошибка обновления токена: " + error,
		};
	}
});
