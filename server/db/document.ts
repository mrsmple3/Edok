import { prisma } from "~/server/db/index";
import { EventHandlerRequest, H3Event } from "h3";
import fs, { mkdir, stat, writeFile } from "fs/promises";
import path, { join } from "path";
import mime from "mime";

// async function signDocument(documentId: number, userId: number) {
//     const document = await prisma.document.findUnique({ where: { id: documentId } });
//     const user = await prisma.user.findUnique({ where: { id: userId } });
//
//     // Генерация подписи
//     const signature = generateSignature(document.content, user.privateKey);
//
//     // Сохранение подписи
//     await prisma.signature.create({
//         data: {
//             documentId,
//             userId,
//             signature,
//         },
//     });
// }

export const getAllDocuments = () => {
	return prisma.document.findMany({
		include: {
			user: true,
			counterparty: true,
			lead: true,
		},
	});
};

export const getDocumentById = (id: number) => {
	return prisma.document.findUnique({
		where: { id },
		include: {
			user: true,
			counterparty: true,
			lead: true,
		},
	});
};

export const createDocument = (data: any) => {
	return prisma.document.create({
		data: {
			title: data.title,
			filePath: data.filePath,
			content: data.content,
			type: data.type,
			status: data.status,
			user: {
				connect: { id: data.userId },
			},
			counterparty: {
				connect: { id: data.counterpartyId },
			},
		},
		include: {
			user: true,
			counterparty: true,
			lead: true,
		},
	});
};

export const updateDocument = (id: number, data: any) => {
	return prisma.document.update({
		where: { id },
		data,
		include: {
			user: true,
			counterparty: true,
			lead: true,
		},
	});
};

export const updateDocumentStatusById = (id: number, status: string) => {
	return prisma.document.update({
		where: { id },
		data: { status },
	});
};

export const deleteDocuments = () => {
	return prisma.document.deleteMany();
};

export const deleteDocument = (id: number) => {
	return prisma.document.delete({
		where: { id },
	});
};

export const deleteDocumentById = async (event: H3Event<EventHandlerRequest>, id: string) => {
	const document = await getDocumentById(parseInt(id));

	if (!document) {
		event.res.statusCode = 404;
		return {
			code: 404,
			body: {
				error: "Документ не найден",
			},
		};
	}

	// Удалить файл с диска
	if (document.filePath) {
		const response = await deleteFileOnDocument(event, document);
		if (response.status !== 200) {
			return response;
		}
	}

	// Удалить документ из базы данных
	try {
		await deleteDocument(parseInt(id));
	} catch (error) {
		console.error("Error deleting document:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: {
				error: "Ошибка при удалении документа " + error,
			},
		};
	}

	return {
		code: 200,
		body: {
			message: "Document deleted successfully",
		},
	};
};

export const deleteFileOnDocument = async (event: H3Event<EventHandlerRequest>, document: any) => {
	const filePath = path.join(process.cwd(), "public", document.filePath);

	try {
		await fs.unlink(filePath);
		return {
			status: 200,
			body: {
				message: "File deleted successfully",
			},
		};
	} catch (error) {
		console.error("Error deleting file:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: {
				error: "Ошибка при удалении файла " + error,
			},
		};
	}
};

export const deleteAllFilesOfDocuments = async (event: H3Event<EventHandlerRequest>) => {
	const documents = await getAllDocuments();

	if (documents.length === 0) {
		return {
			code: 404,
			body: {
				error: "Документы не найдены",
			},
		};
	}

	for (const document of documents) {
		if (document.filePath) {
			const response = await deleteFileOnDocument(event, document);
			if (response.status !== 200) {
				return response;
			}
		}
	}

	return {
		code: 200,
		body: {
			message: "All files deleted successfully",
		},
	};
};

export const createFile = async (
	event: H3Event<EventHandlerRequest>,
	file: File
): Promise<{ status: number; body: { fileUrl?: string; message?: string } }> => {
	const allowedMimeTypes = [
		"image/jpeg",
		"image/png",
		"image/svg+xml",
		"application/pdf",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	];

	if (!allowedMimeTypes.includes(file.type)) {
		event.res.statusCode = 400;
		return {
			status: 400,
			body: { error: "Не поддерживающий тип документа" },
		};
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const relativeUploadDir = `/uploads/${new Date(Date.now())
		.toLocaleDateString("id-ID", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		})
		.replace(/\//g, "-")}`;

	const uploadDir = join(process.cwd(), "public", relativeUploadDir);

	try {
		await stat(uploadDir);
	} catch (e: any) {
		if (e.code === "ENOENT") {
			await mkdir(uploadDir, { recursive: true });
		} else {
			console.error("Error while trying to create directory when uploading a file\n", e);
			event.res.statusCode = 500;
			return {
				status: 500,
				message: "Something went wrong." + e,
			};
		}
	}

	try {
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		const filename = `${file.name.replace(/\.[^/.]+$/, "")}-${uniqueSuffix}.${mime.getExtension(file.type)}`;
		await writeFile(`${uploadDir}/${filename}`, buffer);
		const fileUrl = `${relativeUploadDir}/${filename}`;

		return {
			status: 200,
			body: { fileUrl },
		};
	} catch (e) {
		console.error("Error while trying to upload a file\n", e);
		event.res.statusCode = 500;
		return {
			status: 500,
			body: { error: "Something went wrong." + e },
		};
	}
};

export const createDocumentWithFile = async (event: H3Event<EventHandlerRequest>, data: any) => {
	const title = (data.get("title") as string) || null;
	const content = (data.get("content") as string) || null;
	const file = (data.get("file") as File) || null;
	const userId = data.get("userId") as string;
	const type = (data.get("type") as string) || null;
	const status = (data.get("status") as string) || null;

	const fileUrl = createFile(event, file);

	return createDocument({
		title,
		filePath: fileUrl,
		userId: parseInt(userId),
		content,
		type,
		status,
	});
};

export const getDocumentsByLead = (leadId: number) => {
	return prisma.document.findMany({
		where: { leadId },
		include: {
			user: true,
			counterparty: true,
			lead: true,
		},
	});
};

export const getDocumentsByUserId = (userId: number) => {
	return prisma.document.findMany({
		where: { userId: userId },
		include: {
			user: true,
			counterparty: true,
			lead: true,
		},
	});
};

export const getDocumentByUserRole = (userId: number, role: string) => {
	switch (role) {
		case "admin":
			return prisma.document.findMany();
			break;
		case "user":
			return prisma.document.findMany({
				where: {
					userId,
				},
			});
			break;
		case "bookkeeper":
			break;
		case "lawyer":
			break;
		case "manager":
			break;
		default:
			//
			break;
	}
};
