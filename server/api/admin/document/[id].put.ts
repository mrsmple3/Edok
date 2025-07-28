import { getDocumentById, updateDocument, updateDocumentModeratorById } from "~/server/db/document";
import { getUserById } from "~/server/db/users";

export default defineEventHandler(async (event) => {
	try {
		const { id } = event.context.params;
		const body = await readBody(event);

		console.log(body);

		const document = await getDocumentById(parseInt(id));

		if (body.userId) {
			const user = await getUserById(parseInt(body.userId));
			if (!user) {
				event.res.statusCode = 404;
				return {
					code: 404,
					body: {
						error: "Користувач не знайдено",
					},
				};
			}
		}
		if (body.counterpartyId) {
			const user = await getUserById(parseInt(body.counterpartyId));
			if (!user) {
				event.res.statusCode = 404;
				return {
					code: 404,
					body: {
						error: "Контрагент не знайдено",
					},
				};
			}
		}

		if (!document) {
			event.res.statusCode = 404;
			return {
				code: 404,
				body: {
					error: "Документ не знайдено",
				},
			};
		}

		const updatedDocument = await updateDocument(parseInt(id), body);

		return {
			code: 200,
			body: {
				document: updatedDocument,
			},
		};
	} catch (error) {
		console.error("Error updating document:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: {
				error: "Помилка під час оновлення документа " + error
			},
		};
	}
});
