import { getDocumentsByUserId } from "~/server/db/document";

export default defineEventHandler(async (event) => {
	const { id } = event.context.params;

	try {
		const documents = await getDocumentsByUserId(parseInt(id));

		if (documents.length === 0) {
			event.res.statusCode = 404;
			return {
				code: 404,
				body: {
					error: "Документы не найдены",
				},
			};
		}

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
