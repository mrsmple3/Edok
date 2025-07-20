import { getAllDocuments, getSignedDocuments } from "~/server/db/document";

export default defineEventHandler(async (event) => {
  try {
    const documents = await getSignedDocuments();

    return {
      code: 200,
      body: { documents },
    };
  } catch (error) {
    console.error("Error getting leads:", error);
    event.res.statusCode = 500;
    return {
      code: 500,
      body: {
        error: "Помилка при отриманні архіву" + error
      }
    };
  }
});
