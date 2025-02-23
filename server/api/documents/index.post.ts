import { PrismaClient } from "@prisma/client";
import mime from "mime";
import { join } from "path";
import { mkdir, stat, writeFile } from "fs/promises";
import { defineEventHandler, readFormData } from "h3";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
    const formData = await readFormData(event);

    const title = formData.get("title") as string || null;
    const file = formData.get("file") as File || null;
    const userId = formData.get("userId") as string || null;

    console.log(title)


    if (!title || !file || !userId) {
        return {
            status: 400,
            body: { error: "Missing required fields" },
        };
    }

    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/svg+xml",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];

    if (!allowedMimeTypes.includes(file.type)) {
        return {
            status: 400,
            body: { error: "Unsupported file type" },
        };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const relativeUploadDir = `/uploads/${new Date(Date.now())
        .toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
        .replace(/\//g, "-")}`;

    const uploadDir = join(process.cwd(), "public", relativeUploadDir);
    try {
        await stat(uploadDir);
    } catch (e: any) {
        if (e.code === "ENOENT") {
            await mkdir(uploadDir, { recursive: true });
        } else {
            console.error(
                "Error while trying to create directory when uploading a file\n",
                e
            );
            return {
                status: 500,
                message: "Something went wrong." +e,
            };
        }
    }

    try {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const filename = `${file.name.replace(
            /\.[^/.]+$/,
            ""
        )}-${uniqueSuffix}.${mime.getExtension(file.type)}`;
        await writeFile(`${uploadDir}/${filename}`, buffer);
        const fileUrl = `${relativeUploadDir}/${filename}`;

        const document = await prisma.document.create({
            data: {
                title,
                filePath: fileUrl,
                userId: parseInt(userId),
            },
        });

        return {
            status: 200,
            body: { document },
        };
    } catch (e) {
        console.error("Error while trying to upload a file\n", e);
        return {
            status: 500,
            body: { error: "Something went wrong." + e },
        };
    }
});