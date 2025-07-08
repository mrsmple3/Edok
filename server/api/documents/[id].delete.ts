import { defineEventHandler } from "h3";
import { deleteDocumentById } from "~/server/db/document";

export default defineEventHandler(async (event) => {
  const { id } = event.context.params;


  return await deleteDocumentById(event, id);
  // // Найти документ в базе данных
  // const document = getDocumentById(parseInt(id));
  //
  // if (!document) {
  //   event.res.statusCode = 404;
  //   return {
  //     code: 404,
  //     body: {
  //       error: "Документ не найден"
  //     }
  //   };
  // }
  //
  // // Удалить файл с диска
  // if (document.filePath) {
  //   const filePath = path.join(process.cwd(), "public", document.filePath);
  //   try {
  //     await fs.unlink(filePath);
  //   } catch (error) {
  //     console.error("Error deleting file:", error);
  //     event.res.statusCode = 500;
  //     return {
  //       code: 500,
  //       body: {
  //         error: "Ошибка при удалении файла " + error
  //       }
  //     };
  //   }
  // }
  //
  // // Удалить документ из базы данных
  // try {
  //   await deleteDocument(parseInt(id));
  // } catch (error) {
  //   console.error("Error deleting document:", error);
  //   event.res.statusCode = 500;
  //   return {
  //     code: 500,
  //     body: {
  //       error: "Ошибка при удалении документа " + error
  //     }
  //   };
  // }
  //
  //
  // return {
  //   code: 200,
  //   body: {
  //     message: "Document deleted successfully"
  //   }
  // };
});
