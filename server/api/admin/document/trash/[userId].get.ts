import { getDocumentsMarkedForDeletionByUserId } from "~/server/db/document";

export default defineEventHandler(async (event) => {
	try {
		const userId = Number(event.context.params?.userId);

		if (!userId || Number.isNaN(userId)) {
			event.res.statusCode = 400;
			return {
				code: 400,
				body: { error: "Некоректний ідентифікатор користувача" },
			};
		}

		const documents = await getDocumentsMarkedForDeletionByUserId(userId);

		return {
			code: 200,
			body: { documents },
		};
	} catch (error) {
		console.error("Error getting user trash documents:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: {
				error: "Помилка при отриманні документів у корзині користувача",
			},
		};
	}
});
