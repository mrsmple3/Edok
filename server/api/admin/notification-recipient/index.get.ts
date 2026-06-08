import { requireStaff } from "~/server/utils/requireStaff";
import { getNotificationRecipients } from "~/server/db/notificationRecipient";

export default defineEventHandler(async (event) => {
	const guard = await requireStaff(event);
	if (!guard.ok) {
		event.res.statusCode = guard.status!;
		return { code: guard.status, body: { error: guard.error } };
	}

	try {
		const recipients = await getNotificationRecipients();
		return { code: 200, body: { recipients } };
	} catch (error: any) {
		console.error("notification-recipient list error:", error);
		event.res.statusCode = 500;
		return { code: 500, body: { error: "Помилка при отриманні списку: " + error.message } };
	}
});
