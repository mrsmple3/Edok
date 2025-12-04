import { prisma } from "~/server/db/index";
import { EventHandlerRequest, H3Event } from "h3";
import fs, { mkdir, stat, writeFile } from "fs/promises";
import path, { join } from "path";
import mime from "mime";
import { createSafeFileName } from "~/server/utils/transliterate";
import { Buffer } from "buffer";

export const getAllDocuments = () => {
	return prisma.document.findMany({
		include: {
			user: true,
			counterparty: true,
			lead: true,
			deleteSigns: true,
			Signature: true,
			moderator: true,
		},
	});
};

export const getDocumentsPaginated = async (params: {
	page: number;
	limit: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	userId?: number;
	leadId?: number;
	userRole?: string;
}) => {
	const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', userId, leadId, userRole } = params;
	const skip = (page - 1) * limit;

	// Формируем условия фильтрации
	const where: any = {};

	if (userRole === 'counterparty' && userId) {
		where.userId = userId;
	}

	if (leadId) {
		where.leadId = leadId;
	}

	// Получаем общее количество документов
	const total = await prisma.document.count({ where });

	// Получаем документы с пагинацией
	const documents = await prisma.document.findMany({
		where,
		skip,
		take: limit,
		orderBy: {
			[sortBy]: sortOrder,
		},
		include: {
			user: true,
			counterparty: true,
			lead: true,
			deleteSigns: true,
			Signature: true,
			moderator: true,
		},
	});

	return {
		documents,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit),
	};
};

export const getDocumentById = (id: number) => {
	return prisma.document.findUnique({
		where: { id },
		include: {
			user: true,
			counterparty: true,
			lead: true,
			deleteSigns: true,
			Signature: true,
			moderator: true,
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
			lead: data.leadId ? { connect: { id: data.leadId } } : undefined,
			moderator: data.moderatorId ? { connect: { id: data.moderatorId } } : undefined,
		},
		include: {
			user: true,
			counterparty: true,
			lead: true,
			deleteSigns: true,
			Signature: true,
			moderator: true,
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
			deleteSigns: true,
			Signature: true,
			moderator: true,
		},
	});
};

export const updateDocumentStatusById = (id: number, status: string) => {
	return prisma.document.update({
		where: { id },
		data: { status },
		include: {
			user: true,
			counterparty: true,
			lead: true,
			deleteSigns: true,
			Signature: true,
		},
	});
};

export const updateDocumentModeratorById = (id: number, moderatorId: number) => {
	return prisma.document.update({
		where: { id },
		data: {
			moderator: {
				connect: { id: moderatorId },
			},
		},
		include: {
			user: true,
			counterparty: true,
			lead: true,
			deleteSigns: true,
			Signature: true,
			moderator: true
		},
	});
};

export const deleteDocuments = async () => {
	await prisma.signature.deleteMany();

	await prisma.documentDeleteSign.deleteMany();

	return prisma.document.deleteMany();
};

export const deleteDocument = async (id: number) => {
	await prisma.signature.deleteMany({
		where: { documentId: id }
	});

	await prisma.documentDeleteSign.deleteMany({
		where: { documentId: id }
	});

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
				error: "Документ не знайдено",
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
				error: "Помилка при видаленні документа " + error,
			},
		};
	}

	return {
		code: 200,
		body: {
			message: "Документ успішно видалено",
		},
	};
};

export const deleteFileOnDocument = async (event: H3Event<EventHandlerRequest> | null, document: any) => {
	const filePath = path.join(process.cwd(), "public", document.filePath);

	try {
		await fs.unlink(filePath);
		return {
			status: 200,
			body: {
				message: "Файл успішно видалено",
			},
		};
	} catch (error: any) {
		console.error("Error deleting file:", error);

		// Если файл не существует, считаем это успехом
		if (error.code === 'ENOENT') {
			return {
				status: 200,
				body: {
					message: "Файл уже був видалений",
				},
			};
		}

		// Устанавливаем статус код только если event существует
		if (event?.res) {
			event.res.statusCode = 500;
		}

		return {
			status: 500,
			body: {
				error: "Помилка видалення файлу " + error,
			},
		};
	}
};

export const resetDocumentDeletionRequest = async (documentId: number) => {
	await prisma.documentDeleteSign.deleteMany({
		where: { documentId },
	});

	return prisma.document.update({
		where: { id: documentId },
		data: {
			deleteSignCount: 0,
		},
		include: {
			user: true,
			counterparty: true,
			lead: true,
			deleteSigns: true,
			Signature: true,
			moderator: true,
		},
	});
};

export const deleteAllFilesOfDocuments = async (event: H3Event<EventHandlerRequest> | null = null) => {
	const documents = await getAllDocuments();

	if (documents.length === 0) {
		return {
			code: 404,
			body: {
				error: "Документів не знайдено",
			},
		};
	}

	for (const document of documents) {
		if (document.filePath) {
			const response = await deleteFileOnDocument(event, document);
			// Продолжаем даже если удаление файла не удалось
			if (response.status !== 200) {
				console.warn(`Failed to delete file for document ${document.id}: ${response.body.error}`);
			}
		}
	}

	return {
		code: 200,
		body: {
			message: "Усі файли успішно видалено",
		},
	};
};

export const createFile = async (
	event: H3Event<EventHandlerRequest>,
	file: File
): Promise<{ status: number; body: { fileUrl?: string; message?: string } }> => {

	const allowedMimeTypes = [
		"application/pdf",
		"application/pkcs7-signature",
	];

	if (!allowedMimeTypes.includes(file.type)) {
		event.res.statusCode = 400;
		return {
			status: 400,
			body: { error: "Тип документа, що не підтримує" },
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
				message: "Щось пішло не так." + e,
			};
		}
	}

	try {
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

		// Создаем безопасное имя файла без кириллических символов
		const cleanName = createSafeFileName(file.name);

		// Определяем правильное расширение
		let extension = mime.getExtension(file.type);
		if (file.type === 'application/pkcs7-signature') {
			extension = 'p7s';
		} else if (file.type === 'application/pdf') {
			extension = 'pdf';
		}

		const filename = `${cleanName}-${uniqueSuffix}.${extension}`;
		await writeFile(`${uploadDir}/${filename}`, buffer);
		const fileUrl = `${relativeUploadDir}/${filename}`;

		console.log(`Файл создан: ${filename}, тип: ${file.type}, расширение: ${extension}`);

		return {
			status: 200,
			body: { fileUrl },
		};
	} catch (e) {
		console.error("Error while trying to upload a file\n", e);
		event.res.statusCode = 500;
		return {
			status: 500,
			body: {
				error: "Щось пішло не так." + e
			},
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
			deleteSigns: true,
			Signature: true,
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
			deleteSigns: true,
			Signature: true,
		},
	});
};

export const getUnsignedDocuments = () => {
	return prisma.document.findMany({
		where: {
			status: {
				not: "Підписано",
			},
		},
		include: {
			user: true,
			counterparty: true,
			lead: true,
			deleteSigns: true,
			Signature: true,
		},
	});
}

export const getUnsignedDocumentsByUserId = (id: number) => {
	return prisma.document.findMany({
		where: {
			userId: id,
			status: {
				not: "Підписано",
			},
		},
		include: {
			user: true,
			counterparty: true,
			lead: true,
			deleteSigns: true,
			Signature: true,
		},
	});
}

export const getSignedDocuments = () => {
	return prisma.document.findMany({
		where: {
			status: {
				equals: "Підписано",
			},
		},
		include: {
			user: true,
			counterparty: true,
			lead: true,
			deleteSigns: true,
			Signature: true,
		},
	});
}

export const getSignedDocumentsByUserId = (id: number) => {
	return prisma.document.findMany({
		where: {
			userId: id,
			status: "Підписано",
		},
		include: {
			user: true,
			counterparty: true,
			lead: true,
			deleteSigns: true,
			Signature: true,
		},
	});
}

export const getDocumentsMarkedForDeletion = () => {
	return prisma.document.findMany({
		where: {
			deleteSignCount: {
				gt: 0,
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		include: {
			user: true,
			counterparty: true,
			lead: true,
			deleteSigns: {
				include: {
					user: true,
				},
			},
			Signature: true,
			moderator: true,
		},
	});
};

export const getDocumentsMarkedForDeletionByUserId = (userId: number) => {
	return prisma.document.findMany({
		where: {
			deleteSignCount: {
				gt: 0,
			},
			deleteSigns: {
				some: {
					userId,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		include: {
			user: true,
			counterparty: true,
			lead: true,
			deleteSigns: {
				include: {
					user: true,
				},
			},
			Signature: true,
			moderator: true,
		},
	});
};

export const getDocumentByUserRole = (userId: number, role: string) => {
	if (role === 'counterparty') {
		return prisma.document.findMany({
			where: {
				counterpartyId: {
					equals: userId,
				},
			},
			include: {
				user: true,
				counterparty: true,
				lead: true,
				deleteSigns: true,
				Signature: true,
			},
		});
	}
	if (role === 'moderator') {
		return prisma.document.findMany({
			where: {
				moderatorId: {
					equals: userId,
				},
			},
			include: {
				user: true,
				counterparty: true,
				lead: true,
				deleteSigns: true,
				Signature: true,
			},
		});
	}
	return prisma.document.findMany({
		where: {
			userId,
		},
		include: {
			user: true,
			counterparty: true,
			lead: true,
			deleteSigns: true,
			Signature: true,
		},
	});
};
