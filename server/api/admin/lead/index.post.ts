import { createLead } from "~/server/db/leads";
import { getUserById } from "~/server/db/users";
import { getOrganizationById } from "~/server/db/organizations";

export default defineEventHandler(async (event) => {
	const body = await readBody(event);

	const { type, name, moderatorsId, counterpartyId, authorId, documents, organizationId } = body;

	if (!type || !name || !authorId || !documents || !organizationId) {
		event.res.statusCode = 400;
		return {
			code: 400,
			body: {
				error: "Необхідно вказати всі поля",
				missingFields: [
					!type ? "type" : null,
					!authorId ? "authorId" : null,
					!documents ? "documents" : null,
					!name ? "name" : null,
					!organizationId ? "organizationId" : null,
				].filter(Boolean),
			},
		};
	}

	try {
		const author = await getUserById(authorId);

		if (!author) {
			event.res.statusCode = 404;
			return {
				code: 404,
				body: {
					error: "Користувач не знайдено"
				},
			};
		}

		if (moderatorsId) {
			const moderator = await getUserById(moderatorsId);
			if (!moderator) {
				event.res.statusCode = 404;
				return {
					code: 404,
					body: { error: "Модератора не знайдено" },
				};
			} else if (moderator.role !== "moderator") {
				event.res.statusCode = 400;
				return {
					code: 400,
					body: {
						error: "Модератора з таким ID не існує"
					},
				};
			}
		} else if (counterpartyId) {
			const counterparty = await getUserById(counterpartyId);
			if (!counterparty) {
				event.res.statusCode = 404;
				return {
					code: 404,
					body: {
						error: "Контрагент не знайдено"
					},
				};
			} else if (counterparty.role !== "counterparty") {
				event.res.statusCode = 400;
				return {
					code: 400,
					body: {
						error: "Контрагента з таким ID не існує"
					},
				};
			}
		}

		const organization = await getOrganizationById(Number(organizationId));
		if (!organization) {
			event.res.statusCode = 404;
			return {
				code: 404,
				body: { error: "Організацію не знайдено" },
			};
		}

		const lead = await createLead(event, body);

		return {
			status: 201,
			body: { lead },
		};
	} catch (error) {
		console.error("Error creating lead:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: { error: "Помилка під час створення договору " + error },
		};
	}
});
