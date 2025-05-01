import { getAllSigns } from "~/server/db/sign";

export default defineEventHandler(async (event) => {
  try {
    const signs = await getAllSigns();

    return {
      code: 200,
      body: { signs },
    };
  } catch (error) {
    console.error("Error deleting leads:", error);
    event.res.statusCode = 500;
    return {
      code: 500,
      body: { error: "Ошибка при удалении лидов " + error },
    };
  }
});
