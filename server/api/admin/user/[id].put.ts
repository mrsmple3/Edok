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
				body: { error: "Пользователь не найден" },
			};
		}

		if (body.role && !checkRoleUser(body.role)) {
			return {
				code: 400,
				body: { error: "Такой роли не существует" },
			};
		} else if (body.email && existUser.email !== body.email) {
			const existEmail = await getUserByEmail(body.email);

			if (existEmail) {
				return {
					code: 400,
					body: { error: "Пользователь с таким email уже существует" },
				};
			}
		} else if (body.phone && existUser.phone !== body.phone) {
			const existPhone = await getUserByPhone(body.phone);

			if (existPhone) {
				return {
					code: 400,
					body: { error: "Пользователь с таким телефоном уже существует" },
				};
			}
		}

		const isChange = changePassword(body.id, body.oldPassword, body.newPassword);

		if (!isChange) {
			event.res.statusCode = 400;
			return {
				code: 400,
				body: { error: "Старый пароль не совпадает" },
			};
		}

		const user = await updateUser(parseInt(id), {
			email: body.email,
			phone: body.phone,
			name: body.name,
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
			body: { error: "Ошибка при обновлении роли пользователя " + error },
		};
	}
});
