import { getOrganizations } from "~/server/db/organizations";

export default defineEventHandler(async (event) => {
	try {
		const organizations = await getOrganizations();

		return {
			code: 200,
			body: {
				organizations,
			},
		};
	} catch (error: any) {
		event.res.statusCode = 500;
		return {
			code: 500,
			body: {
				error: "Помилка під час отримання організацій: " + error,
			},
		};
	}
});
