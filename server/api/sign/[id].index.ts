import { getAllSigns, getSignByDocumentId } from "~/server/db/sign";

export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.params;

    const signs = await getSignByDocumentId(parseInt(id));

    return {
      code: 200,
      body: { signs },
    };
  } catch (error) {
    console.error("Error deleting leads:", error);
    event.res.statusCode = 500;
    return {
      code: 500,
      body: { error: "Помилка при отриманні документа " + error },
    };
  }
});
