import { createDocumentWithFile } from "~/server/db/document";

export default defineEventHandler(async (event) => {
    const formData = await readFormData(event);

    return await createDocumentWithFile(event, formData);
});