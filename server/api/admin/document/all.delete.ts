import { defineEventHandler } from "h3";
import { deleteAllFilesOfDocuments, deleteDocuments, getAllDocuments } from "~/server/db/document";

export default defineEventHandler(async (event) => {
	try {
		// const deletedFilesOfDocuments = await deleteAllFilesOfDocuments(event);

		// if (deletedFilesOfDocuments.code !== 200) {
		// 	event.res.statusCode = 400;
		// 	return deletedFilesOfDocuments;
		// }

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
			body: { error: "Ошибка при удалении всех документов " + error },
		};
	}
});
