import { decodeAccessToken } from "~/server/utils/jwt";
import { prisma } from "~/server/db";
import type { JwtPayload } from "jsonwebtoken";

export default defineEventHandler(async (event) => {
  const token = event.req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    event.res.statusCode = 401;
    return { code: 401, body: { error: "Не авторизовано" } };
  }

  const decoded = decodeAccessToken(token) as JwtPayload | null;
  if (!decoded?.userId) {
    event.res.statusCode = 401;
    return { code: 401, body: { error: "Невалідний токен" } };
  }

  const body = await readBody(event);

  const data: { notificationEmail?: string | null; notificationsEnabled?: boolean } = {};

  if (Object.prototype.hasOwnProperty.call(body, "notificationEmail")) {
    const raw = (body.notificationEmail ?? "").toString().trim();
    if (raw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      event.res.statusCode = 400;
      return { code: 400, body: { error: "Невірний формат email" } };
    }
    data.notificationEmail = raw || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, "notificationsEnabled")) {
    data.notificationsEnabled = Boolean(body.notificationsEnabled);
  }

  if (Object.keys(data).length === 0) {
    event.res.statusCode = 400;
    return { code: 400, body: { error: "Немає полів для оновлення" } };
  }

  try {
    const user = await prisma.user.update({
      where: { id: decoded.userId as number },
      data,
      select: {
        id: true,
        notificationEmail: true,
        notificationsEnabled: true,
      },
    });

    return { code: 200, body: { user } };
  } catch (error: any) {
    console.error("notifications.patch error:", error);
    event.res.statusCode = 500;
    return { code: 500, body: { error: "Помилка оновлення налаштувань: " + error.message } };
  }
});
