import { getDocumentByUserRole, getDocumentsByUserId } from "~/server/db/document";
import { getUserById } from "~/server/db/users";

export default defineEventHandler(async (event) => {
	const { id } = event.context.params;

	try {
		const user = await getUserById(parseInt(id));

		if (!user) {
			event.res.statusCode = 404;
			return {
				code: 404,
				body: { error: "Пользователь не найден" },
			};
		}

		console.log(user);
		const documents = await getDocumentByUserRole(user.id, user.role);
		// console.log(documents);


		return {
			code: 200,
			body: {
				documents,
			},
		};
	} catch (error) {
		console.error("Error getting user documents:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: { error: "Ошибка при получения документов юзера " + error },
		};
	}
});
