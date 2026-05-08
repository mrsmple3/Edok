import {defineEventHandler, readBody} from 'h3';
import fs from 'fs';
import { resolveStoredFilePath } from '~/server/utils/storage';

export default defineEventHandler(async (event) => {
    const {filePath} = await readBody(event);

    try {
        // Удаляем файл из файловой системы
        const absoluteFilePath = resolveStoredFilePath(filePath);
        fs.unlinkSync(absoluteFilePath);

        return {message: 'Файл успешно удален'};
    } catch (error: any) {
        throw createError({statusCode: 500, statusMessage: error.message});
    }
});
