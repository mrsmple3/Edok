import { decodeAccessToken } from "~/server/utils/jwt";
import { prisma } from "~/server/db";
import type { JwtPayload } from "jsonwebtoken";

const ALLOWED_ROLES = ["admin", "moderator", "lawyer", "boogalter"];

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

  const requester = await prisma.user.findUnique({
    where: { id: decoded.userId as number },
    select: { id: true, role: true },
  });

  if (!requester || !ALLOWED_ROLES.includes(requester.role)) {
    event.res.statusCode = 403;
    return { code: 403, body: { error: "Недостатньо прав. Контрагент не може керувати сповіщеннями документа." } };
  }

  const id = Number(event.context.params?.id);
  if (!Number.isFinite(id)) {
    event.res.statusCode = 400;
    return { code: 400, body: { error: "Невірний id документа" } };
  }

  const body = await readBody(event);
  if (typeof body?.notificationsEnabled !== "boolean") {
    event.res.statusCode = 400;
    return { code: 400, body: { error: "Поле notificationsEnabled має бути boolean" } };
  }

  try {
    const document = await prisma.document.update({
      where: { id },
      data: { notificationsEnabled: body.notificationsEnabled },
      select: { id: true, notificationsEnabled: true },
    });

    return { code: 200, body: { document } };
  } catch (error: any) {
    console.error("document/notifications.patch error:", error);
    event.res.statusCode = 500;
    return { code: 500, body: { error: "Помилка оновлення сповіщень документа: " + error.message } };
  }
});
