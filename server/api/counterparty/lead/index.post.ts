import { PrismaClient } from "@prisma/client";
import { defineEventHandler } from "h3";
import { createLead } from "~/server/db/leads";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
	const body = await readBody(event);

	const { type, quantity, moderatorsId, contragentId, authorId, documents } = body;

	if (!type || !quantity || !authorId || !documents) {
		event.res.statusCode = 400;
		return {
			code: 400,
			body: {
				error: "Необходимо указать все поля",
				missingFields: [!type ? "type" : null, !quantity ? "quantity" : null, !authorId ? "authorId" : null, !documents ? "documents" : null].filter(Boolean),
			},
		};
	}

	try {
		const lead = await createLead(event, { type, quantity, moderatorsId, contragentId, authorId, documents });

		return {
			status: 201,
			body: { lead },
		};
	} catch (error) {
		console.error("Error creating lead:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: { error: "Ошибка при создании лида " + error },
		};
	}
});
