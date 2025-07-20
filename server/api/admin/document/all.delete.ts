import { defineEventHandler } from "h3";
import { deleteAllFilesOfDocuments, deleteDocuments, getAllDocuments } from "~/server/db/document";

export default defineEventHandler(async (event) => {
	try {
		const deletedDocuments = await deleteDocuments();

		return {
			code: 200,
			body: { deletedDocuments },
		};
	} catch (error) {
		console.error("Error deleting documents:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: { error: "Помилка при видаленні всіх документів " + error },
		};
	}
});
