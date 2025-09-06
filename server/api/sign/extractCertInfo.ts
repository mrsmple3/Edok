import { defineEventHandler, readFormData } from "h3";
import { extractP7sInfo } from "~/server/db/extractP7sInfo";
import { promises as fs } from "fs";
import path from "path";

export default defineEventHandler(async (event) => {
	try {
		const formData = await readFormData(event);
		const signature = formData.get("signature") as File;

		if (!signature) {
			event.res.statusCode = 400;
			return {
				code: 400,
				body: {
					error: "Файл подписи не найден",
				},
			};
		}

		// Временное сохранение файла подписи на диск для анализа
		const buffer = Buffer.from(await signature.arrayBuffer());
		const tempPath = path.resolve("/tmp", `${Date.now()}-${signature.name}`);
		await fs.writeFile(tempPath, buffer);

		// Парсинг подписи
		const certInfo = await extractP7sInfo(tempPath).catch(() => null);
		await fs.unlink(tempPath);

		return {
			code: 200,
			body: {
				certInfo,
			},
		};
	} catch (error: any) {
		console.error("Error extracting cert info:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: {
				error: "Помилка під час извлечения информации о сертификате: " + error.message,
			},
		};
	}
});
