import { prisma } from "~/server/db";

export default defineEventHandler(async (event) => {
	const { id } = event.context.params;

	try {
		const leads = await prisma.lead.findMany({
			where: {
				authorId: {
					equals: parseInt(id),
				},
			},
			include: {
				author: true,
				documents: true,
			},
		});

		if (!leads.length) {
			event.res.statusCode = 404;
			return {
				code: 404,
				body: {
					error: "Лиды не найдены",
				},
			};
		}

		return {
			code: 200,
			body: { leads },
		};
	} catch (error) {
		console.error("Error fetching leads:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: { error: "Ошибка при получении лидов " + error },
		};
	}
});
