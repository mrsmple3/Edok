import { defineEventHandler, readFormData } from "h3";
import { createDocument, createFile } from "~/server/db/document";

export default defineEventHandler(async (event) => {
	try {
		const formData = await readFormData(event);

		const title = (formData.get("title") as string) || null;
		const content = (formData.get("content") as string) || null;
		const file = (formData.get("file") as File) || null;
		const userId = formData.get("userId") as string;
		const type = (formData.get("type") as string) || null;
		const status = (formData.get("status") as string) || null;

		const fileUrl = await createFile(event, file);

		if (fileUrl.status !== 200) {
			return fileUrl;
		}

		const document = await createDocument({
			title,
			filePath: fileUrl.body.fileUrl,
			userId: parseInt(userId),
			content,
			type,
			status,
		});

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
