import { requireStaff } from "~/server/utils/requireStaff";
import { updateNotificationRecipient } from "~/server/db/notificationRecipient";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

	const body = await readBody(event);
	const data: { email?: string; label?: string | null; enabled?: boolean } = {};

	if (Object.prototype.hasOwnProperty.call(body, "email")) {
		const email = (body.email ?? "").toString().trim().toLowerCase();
		if (!email || !EMAIL_RE.test(email)) {
			event.res.statusCode = 400;
			return { code: 400, body: { error: "Невірний формат email" } };
		}
		data.email = email;
	}
	if (Object.prototype.hasOwnProperty.call(body, "label")) {
		data.label = body.label ? body.label.toString().trim() : null;
	}
	if (Object.prototype.hasOwnProperty.call(body, "enabled")) {
		data.enabled = Boolean(body.enabled);
	}

	if (Object.keys(data).length === 0) {
		event.res.statusCode = 400;
		return { code: 400, body: { error: "Немає полів для оновлення" } };
	}

	try {
		const recipient = await updateNotificationRecipient(id, data);
		return { code: 200, body: { recipient } };
	} catch (error: any) {
		if (error?.code === "P2002") {
			event.res.statusCode = 409;
			return { code: 409, body: { error: "Така пошта вже додана" } };
		}
		console.error("notification-recipient update error:", error);
		event.res.statusCode = 500;
		return { code: 500, body: { error: "Помилка при оновленні: " + error.message } };
	}
});
