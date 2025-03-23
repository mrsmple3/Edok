import { createLead } from "~/server/db/leads";
import { getUserById } from "~/server/db/users";

export default defineEventHandler(async (event) => {
	const body = await readBody(event);

	const { type, name, quantity, moderatorsId, counterpartyId, authorId, documents } = body;

	if (!type || !quantity || !name || !authorId || !documents) {
		event.res.statusCode = 400;
		return {
			code: 400,
			body: {
				error: "Необходимо указать все поля",
				missingFields: [
					!type ? "type" : null,
					!quantity ? "quantity" : null,
					!authorId ? "authorId" : null,
					!documents ? "documents" : null,
					!name ? "name" : null,
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
				body: { error: "Пользователь не найден" },
			};
		}

		if (moderatorsId) {
			const moderator = await getUserById(moderatorsId);
			if (!moderator) {
				event.res.statusCode = 404;
				return {
					code: 404,
					body: { error: "Модератор не найден" },
				};
			} else if (moderator.role !== "moderator") {
				event.res.statusCode = 400;
				return {
					code: 400,
					body: { error: "Модератора с таким id не существует" },
				};
			}
		} else if (counterpartyId) {
			const counterparty = await getUserById(counterpartyId);
			if (!counterparty) {
				event.res.statusCode = 404;
				return {
					code: 404,
					body: { error: "Контрагент не найден" },
				};
			} else if (counterparty.role !== "counterparty") {
				event.res.statusCode = 400;
				return {
					code: 400,
					body: { error: "Контрагента с таким id не существует" },
				};
			}
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
			body: { error: "Ошибка при создании лида " + error },
		};
	}
});
