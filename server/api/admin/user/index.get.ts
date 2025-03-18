import { getAllUsers } from "~/server/db/users";

export default defineEventHandler(async (event) => {
	try {
		const users = await getAllUsers();

		return {
			code: 200,
			body: {
				users,
			},
		};
	} catch (error) {
		console.error("Error getting users:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: { error: "Ошибка при получения пользователей " + error },
		};
	}
});
