import { changePassword, checkRoleUser, getUserByEmail, getUserById, getUserByPhone, updateUser, updateUserRole } from "~/server/db/users";

export default defineEventHandler(async (event) => {
	const { id } = event.context.params;
	const body = await readBody(event);

	//check required fields

	try {
		const existUser = await getUserById(parseInt(id));

		if (!existUser) {
			event.res.statusCode = 404;
			return {
				code: 404,
				body: { error: "Користувач не знайдено" },
			};
		}

		if (body.role && !checkRoleUser(body.role)) {
			return {
				code: 400,
				body: {
					error: "Такої ролі не існує"
				},
			};
		} else if (body.email && existUser.email !== body.email) {
			const existEmail = await getUserByEmail(body.email);

			if (existEmail) {
				return {
					code: 400,
					body: {
						error: "Користувач із таким email вже існує"
					},
				};
			}
		} else if (body.phone && existUser.phone !== body.phone) {
			const existPhone = await getUserByPhone(body.phone);

			if (existPhone) {
				return {
					code: 400,
					body: {
						error: "Користувач із таким телефоном вже існує"
					},
				};
			}
		}

		const isChange = changePassword(body.id, body.oldPassword, body.newPassword);

		if (!isChange) {
			event.res.statusCode = 400;
			return {
				code: 400,
				body: {
					error: "Старий пароль не збігається"
				},
			};
		}

		const user = await updateUser(parseInt(id), {
			email: body.email || null,
			phone: body.phone || null,
			organization_name: body.organization_name || null,
			organization_INN: body.organization_INN || null,
			name: body.name || null,
			isActive: body.isActive,
		});

		return {
			code: 200,
			body: { user },
		};
	} catch (error) {
		console.error("Error updating user role:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: {
				error: "Помилка під час оновлення ролі користувача " + error
			},
		};
	}
});
