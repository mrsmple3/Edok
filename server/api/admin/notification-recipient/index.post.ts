import { requireStaff } from "~/server/utils/requireStaff";
import { createNotificationRecipient } from "~/server/db/notificationRecipient";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default defineEventHandler(async (event) => {
	const guard = await requireStaff(event);
	if (!guard.ok) {
		event.res.statusCode = guard.status!;
		return { code: guard.status, body: { error: guard.error } };
	}

	const body = await readBody(event);
	const email = (body?.email ?? "").toString().trim().toLowerCase();
	const label = body?.label ? body.label.toString().trim() : null;

	if (!email || !EMAIL_RE.test(email)) {
		event.res.statusCode = 400;
		return { code: 400, body: { error: "Невірний формат email" } };
	}

	try {
		const recipient = await createNotificationRecipient({ email, label });
		return { code: 201, body: { recipient } };
	} catch (error: any) {
		if (error?.code === "P2002") {
			event.res.statusCode = 409;
			return { code: 409, body: { error: "Така пошта вже додана" } };
		}
		console.error("notification-recipient create error:", error);
		event.res.statusCode = 500;
		return { code: 500, body: { error: "Помилка при додаванні: " + error.message } };
	}
});
