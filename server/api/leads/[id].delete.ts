import { defineEventHandler } from "h3";
import { prisma } from "~/server/db";

export default defineEventHandler(async (event) => {
	const { id } = event.context.params;

	try {
		const lead = await prisma.lead.delete({
			where: { id: parseInt(id) },
		});

		return {
			code: 200,
			body: { message: "Лид успешно удален", lead },
		};
	} catch (error) {
		console.error("Error deleting lead:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: { error: "Ошибка при удалении лида " + error },
		};
	}
});
