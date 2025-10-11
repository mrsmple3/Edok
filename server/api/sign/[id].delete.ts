import { defineEventHandler } from "h3";
import { deleteSignById } from "~/server/db/sign";

export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.params;

    if (!id) {
      event.res.statusCode = 400;
      return {
        code: 400,
        body: {
          error: "ID підпису не вказано",
        },
      };
    }

    const deletedSign = await deleteSignById(parseInt(id));

    return {
      code: 200,
      body: {
        message: "Підпис успішно видалено",
        sign: deletedSign,
      },
    };
  } catch (error: any) {
    console.error("Error deleting signature:", error);
    event.res.statusCode = 500;
    return {
      code: 500,
      body: {
        error: "Помилка при видаленні підпису: " + error.message,
      },
    };
  }
});
