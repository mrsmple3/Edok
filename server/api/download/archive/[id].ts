import { defineEventHandler, getRouterParam, sendStream } from "h3";
import archiver from "archiver";
import { prisma } from "~/server/db";
import { getDocumentById } from "~/server/db/document";
import fs from "fs";
import path from "path";

export default defineEventHandler(async (event) => {
  const { id } = event.context.params;

  const doc = await getDocumentById(parseInt(id));

  if (!doc || !doc.filePath || !doc.Signature?.[0]?.signature) {
    event.res.statusCode = 404;
    return "Документ або підпис не знайдено";
  }

  const archive = archiver("zip", { zlib: { level: 9 } });
  event.res.setHeader("Content-Type", "application/zip");
  event.res.setHeader("Content-Disposition", `attachment; filename=document_${id}.zip`);

  const filePath = path.resolve("public", doc.filePath.replace(/^\\?\\?\//, ""));
  const signaturePath = path.resolve("public", doc.Signature[0].signature.replace(/^\\?\\?\//, ""));
  const stampFilePath = path.resolve("public", doc.Signature[0].stampedFile.replace(/^\\?\\?\//, ""));

  archive.append(fs.createReadStream(filePath), { name: "document.pdf" });

  if (doc.Signature.length > 0) {
    archive.append(fs.createReadStream(signaturePath), { name: "signature.p7s" });
    archive.append(doc.Signature[0].info.replace(/\\n/g, "\n"), { name: "info.txt" });
    archive.append(fs.createReadStream(stampFilePath), { name: "stampPdfFile.pdf" });
  }

  archive.finalize();
  return sendStream(event, archive);
});
