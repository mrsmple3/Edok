import { getDocumentsByUserId } from "~/server/db/document";

export default defineEventHandler(async (event) => {
	const { id } = event.context.params;

	try {
		const documents = await getDocumentsByUserId(parseInt(id));

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
