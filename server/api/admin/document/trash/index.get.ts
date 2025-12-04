import { getDocumentsMarkedForDeletion } from "~/server/db/document";

export default defineEventHandler(async (event) => {
	try {
		const documents = await getDocumentsMarkedForDeletion();

		return {
			code: 200,
			body: { documents },
		};
	} catch (error) {
		console.error("Error getting trash documents:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: {
				error: "Помилка при отриманні документів у корзині",
			},
		};
	}
});
