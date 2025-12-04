import { readBody } from "h3";
import { prisma } from "~/server/db";
import { getDocumentById, resetDocumentDeletionRequest } from "~/server/db/document";

export default defineEventHandler(async (event) => {
	try {
		const { userId, documentId } = await readBody(event);

		if (!userId || !documentId) {
			event.res.statusCode = 400;
			return {
				code: 400,
				body: {
					error: "Необхідно вказати користувача та документ",
				},
			};
		}

		const [user, document] = await Promise.all([
			prisma.user.findUnique({ where: { id: Number(userId) } }),
			getDocumentById(Number(documentId)),
		]);

		if (!document) {
			event.res.statusCode = 404;
			return {
				code: 404,
				body: { error: "Документ не знайдено" },
			};
		}

		if (!user) {
			event.res.statusCode = 404;
			return {
				code: 404,
				body: { error: "Користувача не знайдено" },
			};
		}

		if (document.deleteSignCount === 0) {
			event.res.statusCode = 400;
			return {
				code: 400,
				body: { error: "Документ не перебуває у корзині" },
			};
		}

		const hasAccess =
			user.role === "admin" ||
			user.role === "boogalter" ||
			user.canDeleterDocuments ||
			document.deleteSigns.some((sign) => sign.userId === user.id) ||
			document.userId === user.id ||
			document.counterpartyId === user.id;

		if (!hasAccess) {
			event.res.statusCode = 403;
			return {
				code: 403,
				body: { error: "Недостатньо прав для відновлення документа" },
			};
		}

		const restoredDocument = await resetDocumentDeletionRequest(document.id);

		return {
			code: 200,
			body: {
				document: restoredDocument,
				message: "Запит на видалення скасовано",
			},
		};
	} catch (error) {
		console.error("Error restoring document:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: { error: "Помилка при відновленні документа" },
		};
	}
});
