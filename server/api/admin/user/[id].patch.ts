import { getUserById, updateUser } from "~/server/db/users";

export default defineEventHandler(async (event) => {
  const { id } = event.context.params;
  const body = await readBody(event);

  try {
    const existUser = await getUserById(parseInt(id));

    if (!existUser) {
      event.res.statusCode = 404;
      return {
        code: 404,
        body: { error: "Користувач не знайдено" },
      };
    }

    // Подготавливаем объект для частичного обновления
    const updateData: any = {};

    // Добавляем только те поля, которые переданы в body
    if (body.hasOwnProperty('canDeleterDocuments')) {
      updateData.canDeleterDocuments = body.canDeleterDocuments;
    }
    if (body.hasOwnProperty('isActive')) {
      updateData.isActive = body.isActive;
    }
    if (body.hasOwnProperty('role')) {
      updateData.role = body.role;
    }
    if (body.hasOwnProperty('email')) {
      updateData.email = body.email;
    }
    if (body.hasOwnProperty('phone')) {
      updateData.phone = body.phone;
    }
    if (body.hasOwnProperty('organization_name')) {
      updateData.organization_name = body.organization_name;
    }
    if (body.hasOwnProperty('organization_INN')) {
      updateData.organization_INN = body.organization_INN;
    }
    if (body.hasOwnProperty('name')) {
      updateData.name = body.name;
    }

    const user = await updateUser(parseInt(id), updateData);

    return {
      code: 200,
      body: { user },
    };
  } catch (error) {
    console.error("Error patching user:", error);
    event.res.statusCode = 500;
    return {
      code: 500,
      body: {
        error: "Помилка під час часткового оновлення користувача: " + error
      },
    };
  }
});
