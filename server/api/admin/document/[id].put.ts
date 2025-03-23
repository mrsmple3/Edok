import { getDocumentById, updateDocument } from "~/server/db/document";
import { getUserById } from "~/server/db/users";

export default defineEventHandler(async (event) => {
	try {
		const { id } = event.context.params;
		const body = await readBody(event);

		const document = await getDocumentById(parseInt(id));

		if (body.userId) {
			const user = await getUserById(parseInt(body.userId));
			if (!user) {
				event.res.statusCode = 404;
				return {
					code: 404,
					body: {
						error: "Пользователь не найден",
					},
				};
			}
		} else if (body.counterpartyId) {
			const user = await getUserById(parseInt(body.counterpartyId));
			if (!user) {
				event.res.statusCode = 404;
				return {
					code: 404,
					body: {
						error: "Контрагент не найден",
					},
				};
			}
		}

		if (!document) {
			event.res.statusCode = 404;
			return {
				code: 404,
				body: {
					error: "Документ не найден",
				},
			};
		}

		return await updateDocument(parseInt(id), body);
	} catch (error) {
		console.error("Error updating document:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: { error: "Ошибка при обновлении документа " + error },
		};
	}
});
