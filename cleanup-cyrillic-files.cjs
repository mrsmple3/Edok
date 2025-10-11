// Утилита для переименования файлов с кириллическими символами
const fs = require('fs');
const path = require('path');

function transliterate(text) {
    const translitMap = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
        'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
        'і': 'i', 'ї': 'yi', 'є': 'ye', 'ґ': 'g',
        'І': 'I', 'Ї': 'Yi', 'Є': 'Ye', 'Ґ': 'G'
    };
    
    return text.replace(/[а-яё іїєґА-ЯЁ ІЇЄҐ]/g, (char) => {
        return translitMap[char] || char;
    });
}

function createSafeFileName(originalName) {
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    
    const transliterated = transliterate(nameWithoutExt);
    const cleanName = transliterated
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    
    return (cleanName || 'file') + extension;
}

function scanDirectory(dirPath) {
    const cyrillicFiles = [];
    
    function scanRecursive(currentPath) {
        try {
            const files = fs.readdirSync(currentPath);
            
            files.forEach(file => {
                const fullPath = path.join(currentPath, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanRecursive(fullPath);
                } else {
                    // Проверяем, содержит ли имя файла кириллические символы
                    if (/[а-яё іїєґА-ЯЁ ІЇЄҐ]/.test(file)) {
                        const safeName = createSafeFileName(file);
                        const newPath = path.join(path.dirname(fullPath), safeName);
                        
                        cyrillicFiles.push({
                            original: fullPath,
                            new: newPath,
                            originalName: file,
                            newName: safeName
                        });
                    }
                }
            });
        } catch (error) {
            console.error(`Ошибка при сканировании ${currentPath}:`, error.message);
        }
    }
    
    scanRecursive(dirPath);
    return cyrillicFiles;
}

// Сканируем папку uploads
const uploadsPath = path.join(__dirname, 'public', 'uploads');
console.log('Сканируем папку:', uploadsPath);
console.log('');

const cyrillicFiles = scanDirectory(uploadsPath);

console.log(`Найдено файлов с кириллическими символами: ${cyrillicFiles.length}`);
console.log('');

if (cyrillicFiles.length > 0) {
    console.log('Список файлов для переименования:');
    cyrillicFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.originalName} → ${file.newName}`);
    });
    
    console.log('');
    console.log('ВНИМАНИЕ: Для переименования этих файлов нужно также обновить');
    console.log('соответствующие записи в базе данных!');
    console.log('');
    console.log('Чтобы переименовать файлы, запустите скрипт с параметром --rename');
} else {
    console.log('Файлы с кириллическими символами не найдены.');
}

// Если передан параметр --rename, переименовываем файлы
if (process.argv.includes('--rename')) {
    console.log('Начинаем переименование файлов...');
    
    cyrillicFiles.forEach((file, index) => {
        try {
            fs.renameSync(file.original, file.new);
            console.log(`✅ ${index + 1}/${cyrillicFiles.length}: ${file.originalName} → ${file.newName}`);
        } catch (error) {
            console.error(`❌ Ошибка при переименовании ${file.originalName}:`, error.message);
        }
    });
    
    console.log('Переименование завершено!');
}