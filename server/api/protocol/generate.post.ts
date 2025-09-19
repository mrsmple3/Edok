import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { defineEventHandler, readBody, createError, setHeader, getRequestURL } from 'h3';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { signature, protocolNumber, documentTitle } = body;

    if (!signature) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Signature data is required'
      });
    }

    // Создаем PDF документ
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Загружаем украинский шрифт с файловой системы
    let font: any;
    let boldFont: any;
    try {
      // Попробуем разные пути к шрифтам
      const possibleFontPaths = [
        path.resolve('./public/fonts/DejaVuSans.ttf'),
        path.resolve('./.output/public/fonts/DejaVuSans.ttf'),
        path.resolve('./assets/fonts/DejaVuSans.ttf'),
        '/var/www/agroedoc_com_usr/data/www/Edok/public/fonts/DejaVuSans.ttf'
      ];

      const possibleBoldFontPaths = [
        path.resolve('./public/fonts/DejaVuSans-Bold.ttf'),
        path.resolve('./.output/public/fonts/DejaVuSans-Bold.ttf'),
        path.resolve('./assets/fonts/DejaVuSans-Bold.ttf'),
        '/var/www/agroedoc_com_usr/data/www/Edok/public/fonts/DejaVuSans-Bold.ttf'
      ];

      let fontPath = '';
      let boldFontPath = '';

      // Находим существующий путь к обычному шрифту
      for (const testPath of possibleFontPaths) {
        if (fs.existsSync(testPath)) {
          fontPath = testPath;
          break;
        }
      }

      // Находим существующий путь к жирному шрифту
      for (const testPath of possibleBoldFontPaths) {
        if (fs.existsSync(testPath)) {
          boldFontPath = testPath;
          break;
        }
      }

      if (!fontPath) {
        console.error('Шрифт не найден по путям:', possibleFontPaths);
        throw new Error('Font file not found');
      }

      console.log('Загрузка шрифта из:', fontPath);

      // Читаем основной шрифт
      const fontBytes = fs.readFileSync(fontPath);
      font = await pdfDoc.embedFont(fontBytes);
      console.log('Основной шрифт загружен успешно');

      // Пытаемся загрузить жирный шрифт
      if (boldFontPath) {
        try {
          const boldFontBytes = fs.readFileSync(boldFontPath);
          boldFont = await pdfDoc.embedFont(boldFontBytes);
          console.log('Жирный шрифт загружен успешно');
        } catch (boldError) {
          console.log('Жирный шрифт не найден, используем обычный');
          boldFont = font;
        }
      } else {
        console.log('Жирный шрифт не найден, используем обычный');
        boldFont = font;
      }

    } catch (error) {
      console.error('Ошибка загрузки шрифта:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось загрузить шрифт для украинского текста'
      });
    }

    // Добавляем страницу
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    let currentY = height - margin;

    // Функция для добавления текста с переносом строк
    function addText(text: string, x: number, y: number, options: {
      font?: any;
      size?: number;
      color?: any;
      maxWidth?: number;
    } = {}) {
      const textFont = options.font || font;
      const fontSize = options.size || 12;
      const textColor = options.color || rgb(0, 0, 0);
      const maxWidth = options.maxWidth || width - margin * 2;

      // Разбиваем текст на строки если нужно
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = textFont.widthOfTextAtSize(testLine, fontSize);

        if (textWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            lines.push(word);
          }
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      // Рисуем каждую строку
      let yPos = y;
      for (const line of lines) {
        page.drawText(line, {
          x,
          y: yPos,
          size: fontSize,
          font: textFont,
          color: textColor,
        });
        yPos -= fontSize + 4;
      }

      return yPos - 5; // Возвращаем новую позицию Y
    }

    // Заголовок
    currentY = addText(`ПРОТОКОЛ ЕЛЕКТРОННОГО ПІДПИСУ №${protocolNumber}`,
      margin, currentY, {
      font: boldFont,
      size: 18
    }
    );
    currentY -= 20;

    // Информация о документе
    currentY = addText(`Документ: ${documentTitle || 'Без назви'}`,
      margin, currentY, { size: 12 }
    );

    currentY = addText(`Дата створення протоколу: ${new Date().toLocaleDateString('uk-UA')}`,
      margin, currentY, { size: 12 }
    );
    currentY -= 15;

    // 1. Информация о подписанте
    currentY = addText('1. ІНФОРМАЦІЯ ПРО ПІДПИСАНТА',
      margin, currentY, {
      font: boldFont,
      size: 14
    }
    );

    if (signature.User) {
      currentY = addText(`Користувач системи: ${signature.User.name}`,
        margin, currentY, { size: 11 }
      );
    }

    if (signature.createdAt) {
      const date = new Date(signature.createdAt);
      const formattedDate = date.toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      currentY = addText(`Дата і час підпису: ${formattedDate}`,
        margin, currentY, { size: 11 }
      );
    }
    currentY -= 15;

    // 2. Данные сертификата
    if (signature.info) {
      currentY = addText('2. ДАНІ ЕЛЕКТРОННОГО СЕРТИФІКАТА',
        margin, currentY, {
        font: boldFont,
        size: 14
      }
      );

      // Парсим данные сертификата (используем ту же логику что в интерфейсе)
      const structuredInfo = parseSignatureInfo(signature.info);

      for (const section of structuredInfo) {
        currentY = addText(section.title,
          margin, currentY, {
          font: boldFont,
          size: 12
        }
        );

        for (const item of section.items) {
          currentY = addText(`${item.key}:`,
            margin + 10, currentY, {
            font: boldFont,
            size: 10
          }
          );

          currentY = addText(item.value,
            margin + 20, currentY, {
            size: 10,
            maxWidth: width - margin - 30
          }
          );
        }
        currentY -= 10;
      }
    }

    // 3. Файлы подписи
    currentY = addText('3. ФАЙЛИ ПІДПИСУ',
      margin, currentY, {
      font: boldFont,
      size: 14
    }
    );

    if (signature.signature) {
      currentY = addText('• Файл електронного підпису (.p7s)',
        margin, currentY, { size: 11 }
      );
      currentY = addText(`  ${signature.signature}`,
        margin + 10, currentY, { size: 9 }
      );
    }

    if (signature.stampedFile) {
      currentY = addText('• Підписаний документ з печаткою',
        margin, currentY, { size: 11 }
      );
      currentY = addText(`  ${signature.stampedFile}`,
        margin + 10, currentY, { size: 9 }
      );
    }

    currentY -= 20;

    // Подвал
    addText('Протокол згенеровано автоматично системою електронного документообігу',
      margin, currentY, {
      size: 10,
      color: rgb(0.5, 0.5, 0.5)
    }
    );

    // Сериализуем PDF
    const pdfBytes = await pdfDoc.save();

    // Устанавливаем заголовки для скачивания
    const fileName = `protocol_${protocolNumber}_${new Date().toLocaleDateString('uk-UA').replace(/\./g, '-')}.pdf`;

    setHeader(event, 'Content-Type', 'application/pdf');
    setHeader(event, 'Content-Disposition', `attachment; filename="${fileName}"`);
    setHeader(event, 'Content-Length', pdfBytes.length);

    return pdfBytes;

  } catch (error) {
    console.error('Ошибка генерации PDF:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Помилка генерації PDF'
    });
  }
});

// Функция для парсинга информации о сертификате
function parseSignatureInfo(info: string) {
  if (!info) return [];

  const sections: Array<{
    title: string;
    items: Array<{ key: string; value: string }>;
  }> = [
      {
        title: 'Власник сертифіката',
        items: []
      }
    ];

  try {
    const normalized = info.replace(/\\n/g, "\n");
    const lines = normalized.split("\n").map(line => line.trim()).filter(line => line);

    for (const line of lines) {
      if (line.includes(":")) {
        const [key, ...valueParts] = line.split(":");
        const value = valueParts.join(":").trim();

        if (key && value && key.trim() === 'Subject') {
          const subjectItems = parseSubjectData(value);
          sections[0].items.push(...subjectItems);
          break;
        }
      }
    }
  } catch (error) {
    console.error('Ошибка парсинга Subject:', error);
  }

  return sections.filter(section => section.items.length > 0);
}

function parseSubjectData(subject: string) {
  const data: { [key: string]: string } = {};

  // Сначала ищем и извлекаем serialNumber
  const serialNumberMatch = subject.match(/\/serialNumber=([^,]+)/);
  if (serialNumberMatch) {
    data['serialNumber'] = serialNumberMatch[1].trim();
    // Удаляем serialNumber из строки для дальнейшего парсинга
    subject = subject.replace(/\/serialNumber=[^,]+/, '');
  }

  const pairs = subject.split(',').map(pair => pair.trim());

  pairs.forEach(pair => {
    const [key, value] = pair.split('=', 2);
    if (key && value) {
      data[key.trim()] = value.trim();
    }
  });

  // Конвертируем объект в массив объектов с правильной структурой
  return Object.entries(data).map(([key, value]) => ({ key, value }));
}

function decodeHexString(hexStr: string): string {
  try {
    if (!hexStr) return '';

    const cleaned = hexStr.replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    if (hexStr.includes('\\x')) {
      try {
        const bytes = new Uint8Array([...cleaned].map(char => char.charCodeAt(0)));
        return new TextDecoder('utf-8').decode(bytes);
      } catch (utfError) {
        return cleaned;
      }
    }

    return cleaned;
  } catch (error) {
    return hexStr || '';
  }
}

function formatCertificateFieldName(fieldName: string): string {
  const certificateFieldMap: { [key: string]: string } = {
    'CN': 'Повне ім\'я / Назва організації',
    'O': 'Організація',
    'OU': 'Підрозділ організації',
    'L': 'Місто / Населений пункт',
    'ST': 'Область / Регіон',
    'C': 'Країна',
    'SN': 'Прізвище',
    'GN': 'Ім\'я та по батькові',
    'givenName': 'Ім\'я',
    'surname': 'Прізвище',
    'title': 'Посада / Звання',
    'serialNumber': 'ІПН / Серійний номер',
    'UID': 'Унікальний ідентифікатор',
    'organizationIdentifier': 'Ідентифікатор організації',
    'street': 'Адреса (вулиця, будинок)',
    'postalCode': 'Поштовий індекс',
    'businessCategory': 'Категорія діяльності',
    'emailAddress': 'Електронна пошта',
    'telephoneNumber': 'Номер телефону',
    'description': 'Опис'
  };

  if (certificateFieldMap[fieldName]) {
    return certificateFieldMap[fieldName];
  }

  for (const [key, value] of Object.entries(certificateFieldMap)) {
    if (fieldName.includes(key)) {
      return value;
    }
  }

  return fieldName;
}
