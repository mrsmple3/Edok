import { defineEventHandler, readFormData } from "h3";
import { createDocument, createFile } from "~/server/db/document";
import { getUserById } from "~/server/db/users";

export default defineEventHandler(async (event) => {
	try {
		const formData = await readFormData(event);

		const title = (formData.get("title") as string) || null;
		const content = (formData.get("content") as string) || null;
		const file = (formData.get("file") as File) || null;
		const userId = formData.get("userId") as string;
		const type = (formData.get("type") as string) || null;
		const status = (formData.get("status") as string) || null;
		const counterpartyId = (formData.get("counterpartyId") as string) || null;

		const fileUrl = await createFile(event, file);

		const user = getUserById(parseInt(userId));

		if (!user) {
			event.res.statusCode = 404;
			return {
				code: 404,
				body: {
					error: "Пользователь не найден",
				},
			};
		}

		let documentData;

		if (!counterpartyId) {
			documentData = {
				title,
				filePath: fileUrl.body.fileUrl,
				userId: parseInt(userId),
				content,
				type,
				status,
			};
		} else {
			const counterparty = getUserById(parseInt(counterpartyId));
			if (!counterparty) {
				event.res.statusCode = 404;
				return {
					code: 404,
					body: { error: "Контрагент не найден" },
				};
			}
			documentData = {
				title,
				filePath: fileUrl.body.fileUrl,
				userId: parseInt(userId),
				content,
				type,
				status,
				counterpartyId: parseInt(counterpartyId),
			};
		}

		const document = await createDocument(documentData);

		return {
			code: 200,
			body: {
				document,
			},
		};
	} catch (error) {
		console.error("Error creating document:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: { error: "Ошибка при создание документа " + error },
		};
	}
});
