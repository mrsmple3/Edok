import type { H3Event } from "h3";
import type { JwtPayload } from "jsonwebtoken";
import { decodeAccessToken } from "~/server/utils/jwt";
import { prisma } from "~/server/db/index";

export interface StaffGuardResult {
	ok: boolean;
	status?: number;
	error?: string;
	userId?: number;
	role?: string;
}

/**
 * Пропускает только сотрудников «нашей стороны» (не контрагентов).
 * Контрагент получает 403.
 */
export async function requireStaff(event: H3Event): Promise<StaffGuardResult> {
	const token = event.req.headers["authorization"]?.split(" ")[1];
	if (!token) {
		return { ok: false, status: 401, error: "Не авторизовано" };
	}

	const decoded = decodeAccessToken(token) as JwtPayload | null;
	if (!decoded?.userId) {
		return { ok: false, status: 401, error: "Невалідний токен" };
	}

	const user = await prisma.user.findUnique({
		where: { id: decoded.userId as number },
		select: { id: true, role: true },
	});

	if (!user) {
		return { ok: false, status: 401, error: "Користувача не знайдено" };
	}

	if (user.role === "counterparty") {
		return { ok: false, status: 403, error: "Недостатньо прав" };
	}

	return { ok: true, userId: user.id, role: user.role };
}
