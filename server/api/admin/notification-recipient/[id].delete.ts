import { requireStaff } from "~/server/utils/requireStaff";
import { deleteNotificationRecipient } from "~/server/db/notificationRecipient";

export default defineEventHandler(async (event) => {
	const guard = await requireStaff(event);
	if (!guard.ok) {
		event.res.statusCode = guard.status!;
		return { code: guard.status, body: { error: guard.error } };
	}

	const id = Number(getRouterParam(event, "id"));
	if (!Number.isFinite(id)) {
		event.res.statusCode = 400;
		return { code: 400, body: { error: "Невірний id" } };
	}

	try {
		await deleteNotificationRecipient(id);
		return { code: 200, body: { success: true } };
	} catch (error: any) {
		console.error("notification-recipient delete error:", error);
		event.res.statusCode = 500;
		return { code: 500, body: { error: "Помилка при видаленні: " + error.message } };
	}
});
