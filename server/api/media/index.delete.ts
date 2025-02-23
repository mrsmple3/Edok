import {defineEventHandler, readBody} from 'h3';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
    const {filePath} = await readBody(event);

    try {
        // Удаляем файл из файловой системы
        const absoluteFilePath = path.join(process.cwd(), 'public', filePath);
        fs.unlinkSync(absoluteFilePath);

        return {message: 'Файл успешно удален'};
    } catch (error: any) {
        throw createError({statusCode: 500, statusMessage: error.message});
    }
});