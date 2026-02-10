import { createOrganization, getOrganizationByInn } from "~/server/db/organizations";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);
		const name = (body?.name ?? "").trim();
		const inn = (body?.inn ?? "").trim();

		if (!name) {
			event.res.statusCode = 400;
			return {
				code: 400,
				body: {
					error: "Необхідно вказати назву організації",
				},
			};
		}

		if (inn) {
			const existing = await getOrganizationByInn(inn);
			if (existing) {
				event.res.statusCode = 400;
				return {
					code: 400,
					body: { error: "Організація з таким ЄДРПОУ вже існує" },
				};
			}
		}

		const organization = await createOrganization({
			name,
			inn: inn || null,
		});

		return {
			code: 201,
			body: { organization },
		};
	} catch (error: any) {
		event.res.statusCode = 500;
		return {
			code: 500,
			body: {
				error: "Помилка під час створення організації: " + error,
			},
		};
	}
});
