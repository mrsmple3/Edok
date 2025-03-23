import { checkRoleUser, createUser, getUserByEmail, getUserByPhone } from "~/server/db/users";
import { userTransformer } from "~/server/transformers/user";
import { sendError } from "h3";
import { generateTokens, sendRefreshToken } from "~/server/utils/jwt";
import { createOrUpdateRefreshToken } from "~/server/db/refreshTokens";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);

		const { name, email, phone, password_hash, role, organization_name, organization_INN } = body;

		if (!password_hash || (!email && !phone) || !role) {
			event.res.statusCode = 400;
			return {
				code: "400",
				body: {
					error: "Необходимо указать email или телефон",
				},
			};
		}

		if (!checkRoleUser(role)) {
			event.res.statusCode = 400;
			return {
				code: 400,
				body: {
					error: "Такой роли не существует",
				},
			};
		}

		let userData = {
			name,
			email,
			phone,
			password_hash,
			role,
			organization_name,
			organization_INN,
		};

		if (email) {
			const userExists = await getUserByEmail(email);

			if (userExists) {
				event.res.statusCode = 400;
				return {
					code: 400,
					body: {
						error: "Пользователь с таким email уже существует",
					},
				};
			}
		}

		if (phone) {
			const userExists = await getUserByPhone(phone);

			if (userExists) {
				event.res.statusCode = 400;
				return {
					code: 400,
					body: {
						error: "Пользователь с таким номером уже существует",
					},
				};
			}
		}

		const user = await createUser(userData);

		const { accessToken, refreshToken } = generateTokens(user);

		// Save it inside the database
		await createOrUpdateRefreshToken({
			token: refreshToken,
			userId: user.id,
		});

		sendRefreshToken(event, refreshToken);

		return {
			code: 200,
			body: {
				access_token: accessToken,
				user: userTransformer(user),
			},
		};
	} catch (error: any) {
		event.res.statusCode = 500;
		return {
			code: 500,
			error: "Ошибка регистрации: " + error,
		};
	}
});
