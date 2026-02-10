import { deleteOrganization, getOrganizationById } from "~/server/db/organizations";

export default defineEventHandler(async (event) => {
	try {
		const { id } = event.context.params;
		const organizationId = Number(id);

		if (!Number.isFinite(organizationId)) {
			event.res.statusCode = 400;
			return {
				code: 400,
				body: { error: "Некоректний ідентифікатор організації" },
			};
		}

		const existing = await getOrganizationById(organizationId);
		if (!existing) {
			event.res.statusCode = 404;
			return {
				code: 404,
				body: { error: "Організацію не знайдено" },
			};
		}

		const organization = await deleteOrganization(organizationId);

		return {
			code: 200,
			body: { organization },
		};
	} catch (error: any) {
		event.res.statusCode = 500;
		return {
			code: 500,
			body: { error: "Помилка під час видалення організації: " + error },
		};
	}
});
