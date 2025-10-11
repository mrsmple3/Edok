import mime from "mime";
import { join } from "path";
import { mkdir, stat, writeFile } from "fs/promises";
import { createSafeFileName } from "~/server/utils/transliterate";


export default defineEventHandler(async (event) => {
    const formData = await readFormData(event);

    const image = formData.get("file") as File || null;

    if (!image) {
        return {
            status: 400,
            body: { error: "Missing required fields" },
        };
    }

    const buffer = Buffer.from(await image.arrayBuffer());
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
                body: { error: "Something went wrong." },
            };
        }
    }

    try {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

        // Создаем безопасное имя файла без кириллических символов
        const cleanName = createSafeFileName(image.name);

        // Определяем правильное расширение
        let extension = mime.getExtension(image.type);
        if (image.type === 'application/pkcs7-signature') {
            extension = 'p7s';
        } else if (image.type === 'application/pdf') {
            extension = 'pdf';
        }

        const filename = `${cleanName}-${uniqueSuffix}.${extension}`;
        await writeFile(`${uploadDir}/${filename}`, buffer);
        const fileUrl = `${relativeUploadDir}/${filename}`;

        console.log(`Медиа файл создан: ${filename}, тип: ${image.type}, расширение: ${extension}`);

        return {
            status: 200,
            body: { filePath: fileUrl },
        };
    } catch (e) {
        console.error("Error while trying to upload a file\n", e);
        return {
            status: 500,
            body: { error: "Something went wrong." },
        };
    }
});
