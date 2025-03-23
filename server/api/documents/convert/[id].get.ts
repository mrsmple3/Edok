import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import { prisma } from "~/server/db";

export default defineEventHandler(async (event) => {
	const { id } = event.context.params;

	if (!id) {
		throw createError({ statusCode: 400, statusMessage: "Document ID is required" });
	}

	const document = await prisma.document.findUnique({
		where: { id: Number(id) },
	});

	if (!document) {
		throw createError({ statusCode: 404, statusMessage: "Document not found" });
	}

	const inputFilePath = path.join(process.cwd(), "public", document.filePath);
	const fileName = path.basename(inputFilePath, path.extname(inputFilePath));
	const outputFilePath = path.join("/tmp", `${fileName}.pdf`);

	console.log(inputFilePath);

	try {
		const formData = new FormData();
		formData.append("file", fs.createReadStream(inputFilePath));
		formData.append("output_format", "pdf");

		const response = await axios.post("http://localhost:3001/convert", formData, {
			headers: formData.getHeaders(),
			responseType: "stream",
		});

		if (response.status !== 200) {
			throw new Error(`Failed to convert document. Status code: ${response.status}`);
		}

		const writer = fs.createWriteStream(outputFilePath);
		response.data.pipe(writer);

		await new Promise((resolve, reject) => {
			writer.on("finish", resolve);
			writer.on("error", reject);
		});

		return {
			success: true,
			outputFilePath,
		};
	} catch (error) {
		if (axios.isAxiosError(error)) {
			console.error(`Axios error: ${error.message}`);
		} else {
			console.error(`Unexpected error: ${error.message}`);
		}
		throw createError({ statusCode: 500, statusMessage: error.message });
	}
});
