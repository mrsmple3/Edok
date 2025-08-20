import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface StampData {
  organizationName: string;
  signerINN: string;
}

interface StampPosition {
  x: number;
  y: number;
  radius: number;
}

export async function addVisibleStamp(signedPdfBytes: ArrayBuffer, stampData?: StampData): Promise<Uint8Array> {
  // Загружаем подписанный PDF
  const pdfDoc = await PDFDocument.load(signedPdfBytes);

  // Используем базовые шрифты
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Получаем первую страницу
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  // Тестовые данные, если не переданы
  const defaultStampData: StampData = {
    organizationName: "TOV 'AGROEDOK'",
    signerINN: "123456789012",
  };

  const data = stampData || defaultStampData;

  // Функция для полной транслитерации кириллицы в латиницу
  const translateToLatin = (text: string): string => {
    const cyrillicToLatin: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
      'Ж': 'ZH', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
      'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
      'Ф': 'F', 'Х': 'H', 'Ц': 'TS', 'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SCH',
      'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'YU', 'Я': 'YA',
      'і': 'i', 'ї': 'yi', 'є': 'ye', 'ґ': 'g',
      'І': 'I', 'Ї': 'YI', 'Є': 'YE', 'Ґ': 'G'
    };

    return text.replace(/[а-яёіїєґА-ЯЁІЇЄҐ]/g, (match) => {
      return cyrillicToLatin[match] || match;
    });
  };

  // Функция для разбивки текста на строки с учетом максимальной длины
  const wrapText = (text: string, maxLength: number): string[] => {
    if (text.length <= maxLength) {
      return [text];
    }

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxLength) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word.substring(0, maxLength));
          currentLine = word.substring(maxLength);
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  // Простой способ определения позиции штампа без сохранения в метаданные
  const getStampPosition = (stampNumber: number = 0): StampPosition => {
    const stampRadius = 60;
    const margin = 30;

    // Позиции штампов по порядку
    const positions = [
      // Правый нижний угол
      { x: width - stampRadius - margin, y: stampRadius + margin },
      // Левый нижний угол
      { x: stampRadius + margin, y: stampRadius + margin },
      // Правый верхний угол
      { x: width - stampRadius - margin, y: height - stampRadius - margin },
      // Левый верхний угол
      { x: stampRadius + margin, y: height - stampRadius - margin },
      // Дополнительные позиции справа снизу вверх
      { x: width - stampRadius - margin, y: stampRadius + margin + 140 },
      { x: width - stampRadius - margin, y: stampRadius + margin + 280 }
    ];

    // Если штампов больше чем позиций, размещаем в правом нижнем углу со смещением
    if (stampNumber >= positions.length) {
      return {
        x: width - stampRadius - margin,
        y: stampRadius + margin + (stampNumber * 140),
        radius: stampRadius
      };
    }

    return {
      ...positions[stampNumber],
      radius: stampRadius
    };
  };

  // Параметры круглой печати
  const stampRadius = 60;

  // Генерируем случайный номер штампа или используем текущее время для уникальности
  const stampNumber = Math.floor(Math.random() * 6); // Случайная позиция от 0 до 5
  const stampPosition = getStampPosition(stampNumber);

  const stampCenterX = stampPosition.x;
  const stampCenterY = stampPosition.y;

  // Рисуем внешний круг печати
  firstPage.drawCircle({
    x: stampCenterX,
    y: stampCenterY,
    size: stampRadius,
    borderColor: rgb(0.39, 0.63, 0.72),
    borderWidth: 1,
    color: rgb(1, 1, 1),
    opacity: 0.6
  });

  // Рисуем внутренний круг
  firstPage.drawCircle({
    x: stampCenterX,
    y: stampCenterY,
    size: stampRadius - 10,
    borderColor: rgb(0.39, 0.63, 0.72),
    borderWidth: 1,
    opacity: 0.6
  });

  // Обработка названия организации
  const orgName = translateToLatin(data.organizationName);
  const orgLines = wrapText(orgName, 16);

  const orgStartY = stampCenterY + 15 + (orgLines.length - 1) * 4;

  orgLines.forEach((line, index) => {
    firstPage.drawText(line, {
      x: stampCenterX - (line.length * 2.5),
      y: orgStartY - (index * 8),
      size: 8,
      color: rgb(0.39, 0.63, 0.72),
      font: boldFont,
      opacity: 1
    });
  });

  // Обработка ИНН
  const inn = data.signerINN;
  const innLines = wrapText(inn, 12);

  const innStartY = stampCenterY - 5 - (innLines.length - 1) * 4;

  innLines.forEach((line, index) => {
    firstPage.drawText(line, {
      x: stampCenterX - (line.length * 2),
      y: innStartY - (index * 7),
      size: 7,
      color: rgb(0.39, 0.63, 0.72),
      font: font,
      opacity: 1
    });
  });

  return await pdfDoc.save();
}
