import { checkRoleUser, getUserByRole } from "~/server/db/users";

export default defineEventHandler(async (event) => {
	const { role } = event.context.params;

	if (!checkRoleUser(role)) {
		event.res.statusCode = 400;
		return {
			code: 400,
			body: {
				error: "Такой роли не существует",
			},
		};
	}

	try {
		const user = await getUserByRole(role);

		if (!user) {
			event.res.statusCode = 404;
			return {
				code: 404,
				body: {
					error: "Пользователей не найдено",
				},
			};
		}

		return {
			code: 200,
			body: {
				user,
			},
		};
	} catch (error) {
		console.error("Error creating document:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: { error: "Ошибка при создание документа " + error },
		};
	}
});
