import { getAllDocuments, getSignedDocumentsByUserId } from "~/server/db/document";
import { getUserById } from '~/server/db/users';

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.params.userId;

    const user = await getUserById(parseInt(userId));

    if (!user) {
      event.res.statusCode = 404;
      return {
        code: 404,
        body: { error: "Пользователь не найден" }
      };
    }

    const documents = await getSignedDocumentsByUserId(user.id);

    return {
      code: 200,
      body: { documents },
    };
  } catch (error) {
    console.error("Error getting leads:", error);
    event.res.statusCode = 500;
    return {
      code: 500,
      body: { error: "Ошибка при получение лидов " + error }
    };
  }
});
