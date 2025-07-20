import { checkRoleUser, createUser } from "~/server/db/users";
import { userTransformer } from "~/server/transformers/user";
import { generateTokens, sendRefreshToken } from "~/server/utils/jwt";
import { createOrUpdateRefreshToken } from "~/server/db/refreshTokens";
import { prisma } from "~/server/db";

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
          error: "Необхідно вказати email або телефон та роль",
        },
      };
    }

    if (!checkRoleUser(role)) {
      event.res.statusCode = 400;
      return {
        code: 400,
        body: {
          error: "Такої ролі не існує",
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
          error: "Користувач із таким email або телефоном вже існує",
        },
      };
    }

    // Create user
    const user = await createUser(body);

    return {
      code: 200,
      body: {
        user: userTransformer(user),
      },
    };
  } catch (error: any) {
    event.res.statusCode = 500;
    return {
      code: 500,
      error: "Помилка реєстрації: " + error,
    };
  }
});
