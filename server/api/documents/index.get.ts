import { getAllDocuments } from "~/server/db/document";

export default defineEventHandler(async (event) => {
	try {
		const document = getAllDocuments();
		return {
			code: 200,
			body: { document },
		};
	} catch (error) {
		console.error("Error deleting leads:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: { error: "Ошибка при удалении лидов " + error },
		};
	}
});
