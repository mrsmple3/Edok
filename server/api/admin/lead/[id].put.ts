import { getDocumentsByLead } from "~/server/db/document";
import { getLeadById, updateLead } from "~/server/db/leads";
import { getUserById } from "~/server/db/users";

export default defineEventHandler(async (event) => {
	const { id } = event.context.params;
	const body = await readBody(event);

	try {
		if (body.moderatorsId) {
			const moderator = await getUserById(body.moderatorsId);
			if (!moderator) {
				event.res.statusCode = 404;
				return {
					code: 404,
					body: { error: "Модератора не знайдено" },
				};
			}
		} else if (body.counterpartyId) {
			const counterparty = await getUserById(body.counterpartyId);
			if (!counterparty) {
				event.res.statusCode = 404;
				return {
					code: 404,
					body: { error: "Контрагент не знайдено" },
				};
			}
		}

		const existLead = await getLeadById(parseInt(id));

		if (!existLead) {
			event.res.statusCode = 404;
			return {
				code: 404,
				body: { error: "Договір не знайдено" },
			};
		}

		const lead = await updateLead(parseInt(id), body);

		return {
			code: 200,
			body: {
				lead,
			},
		};
	} catch (error) {
		console.error("Error updating lead", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: { error: "Помилка під час оновлення договору " + error },
		};
	}
});
