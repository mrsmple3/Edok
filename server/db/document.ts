import { prisma } from "~/server/db/index";
import { EventHandlerRequest, H3Event } from "h3";
import fs, { mkdir, stat, writeFile } from "fs/promises";
import path, { join } from "path";
import mime from "mime";

export const getAllDocuments = () => {
	return prisma.document.findMany({
		include: {
			user: true,
			counterparty: true,
			lead: true,
			deleteSigns: true,
			Signature: true,
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
			deleteSigns: true,
			Signature: true,
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
			deleteSigns: true,
			Signature: true,
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

export const deleteFileOnDocument = async (event: H3Event<EventHandlerRequest>, document: any) => {
	const filePath = path.join(process.cwd(), "public", document.filePath);

	try {
		await fs.unlink(filePath);
		return {
			status: 200,
			body: {
				message: "Файл успішно видалено",
			},
		};
	} catch (error) {
		console.error("Error deleting file:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: {
				error: "Помилка видалення файлу " + error,
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
				error: "Документів не знайдено",
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
			body: {
				error: "Щось пішло не так." + e },
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
