import { PrismaClient } from "@prisma/client";
import { defineEventHandler, readFormData } from "h3";
import { createDocumentWithFile } from "~/server/db/document";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
    const formData = await readFormData(event);

    return await createDocumentWithFile(event, formData);
});