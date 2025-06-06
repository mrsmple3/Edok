import { prisma } from "~/server/db";

export default defineEventHandler(async (event) => {
	try {
		await prisma.lead.deleteMany();
		return {
			code: 200,
			body: { message: "Все лиды успешно удалены" },
		};
	} catch (error) {
		console.error("Error deleting leads:", error);
		event.res.statusCode = 500;
		return {
			code: 500,
			body: { error: "Ошибка при удалении лидов " + error },
		};
	}
});
