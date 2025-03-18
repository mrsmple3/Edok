import { createUser } from "~/server/db/users";
import { userTransformer } from "~/server/transformers/user";
import { sendError } from "h3";
import { generateTokens, sendRefreshToken } from "~/server/utils/jwt";
import { createOrUpdateRefreshToken } from "~/server/db/refreshTokens";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Validate required fields
    const { name, email, phone, password_hash, role } = body;
    if (!password_hash || (!email && !phone) || !role) {
      event.res.statusCode = 400;
      return {
        code: 400,
        body: {
          error: "Необходимо указать email или те��ефон и роль",
        },
      };
    }

    // Check if email or phone already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      event.res.statusCode = 400;
      return {
        code: 400,
        body: {
          error: "Пользователь с таким email или телефоном уже существует",
        },
      };
    }

    // Create user
    const user = await createUser(body);

    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token in the database
    await createOrUpdateRefreshToken({
      token: refreshToken,
      userId: user.id,
    });

    sendRefreshToken(event, refreshToken);

    return {
      code: 200,
      body: {
        access_token: accessToken,
        user: userTransformer(user),
      },
    };
  } catch (error: any) {
    event.res.statusCode = 500;
    return {
      code: 500,
      error: "Ошибка регистрации: " + error,
    };
  }
});