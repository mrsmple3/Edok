import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs';
import * as path from 'path';

interface StampData {
  organizationName: string;
  signerINN: string;
  signerName: string;
  signerPosition: string;
  stampCount: number;
}

export async function addVisibleStamp(signedPdfBytes: ArrayBuffer, stampData: StampData): Promise<Uint8Array> {
  // Загружаем подписанный PDF
  const pdfDoc = await PDFDocument.load(signedPdfBytes);

  pdfDoc.registerFontkit(fontkit);

  // Загружаем шрифт, который поддерживает кириллицу
  let font, boldFont;
  try {
    // Попытка загрузить TTF шрифт с поддержкой кириллицы
    const fontPath = path.resolve(process.cwd(), 'public/fonts/DejaVuSans.ttf');
    const boldFontPath = path.resolve(process.cwd(), 'public/fonts/DejaVuSans-Bold.ttf');

    console.log('Попытка загрузки шрифтов из:', fontPath);

    // Проверяем существование файлов
    if (!fs.existsSync(fontPath)) {
      throw new Error(`Файл шрифта не найден: ${fontPath}`);
    }

    if (!fs.existsSync(boldFontPath)) {
      console.warn(`Жирный шрифт не найден: ${boldFontPath}, используем обычный`);
    }

    const fontBytes = fs.readFileSync(fontPath);
    font = await pdfDoc.embedFont(fontBytes);

    const boldFontBytes = fs.readFileSync(boldFontPath);
    boldFont = await pdfDoc.embedFont(boldFontBytes);

  } catch (error) {
    console.log('Ошибка загрузки TTF шрифта, используем стандартный:', error);
  }

  // Получаем все страницы
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  const data = stampData;

  // Функция для разбивки текста на строки
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

  // Упрощенная логика размещения печатей
  const stampRadius = 60;
  const margin = 30;
  const stampDiameter = stampRadius * 2;
  const stampSpacing = 10;

  // Подсчитываем сколько печатей помещается в строку
  const availableWidth = width - (margin * 2);
  const stampsPerRow = Math.floor((availableWidth + stampSpacing) / (stampDiameter + stampSpacing));

  console.log(`Печатей в строке: ${stampsPerRow}, ширина страницы: ${width}`);

  // Подсчет существующих печатей
  let existingStampsCount = stampData.stampCount || 0;

  console.log(`Существующих печатей: ${existingStampsCount}, новая печать будет под номером: ${existingStampsCount + 1}`);

  // Определяем страницу и позицию
  const targetPageIndex = Math.floor(existingStampsCount / stampsPerRow);
  const positionInRow = existingStampsCount % stampsPerRow;

  console.log(`Целевая страница: ${targetPageIndex + 1}, позиция в строке: ${positionInRow + 1}`);

  // Создаем новые страницы если нужно
  while (pages.length <= targetPageIndex) {
    console.log(`Создаем новую страницу ${pages.length + 1}`);
    pdfDoc.addPage([width, height]);
  }

  // Обновляем массив страниц после добавления новых
  const allPages = pdfDoc.getPages();
  const targetPage = allPages[targetPageIndex];

  // Вычисляем позицию печати
  const startX = margin + stampRadius;
  const stampCenterX = startX + positionInRow * (stampDiameter + stampSpacing);
  const stampCenterY = stampRadius + margin; // Всегда внизу страницы
  const stampColor = data.signerPosition === 'Директор' ? rgb(0.5490, 0.6863, 0.7216) : rgb(0.8118, 0.7451, 0.5922);

  console.log(`Печать будет размещена на странице ${targetPageIndex + 1} в позиции X: ${stampCenterX}, Y: ${stampCenterY}`);

  // Рисуем внешний круг печати
  targetPage.drawCircle({
    x: stampCenterX,
    y: stampCenterY,
    size: stampRadius,
    borderColor: stampColor,
    borderWidth: 2,
    color: rgb(1, 1, 1),
    opacity: 0.6
  });

  // Рисуем внутренний круг
  targetPage.drawCircle({
    x: stampCenterX,
    y: stampCenterY,
    size: stampRadius - 10,
    borderColor: stampColor,
    borderWidth: 1,
    opacity: 0.6
  });

  // Обработка названия организации (БЕЗ транслитерации!)
  const orgName = data.signerPosition === 'Директор' ? data.signerName : data.organizationName || data.signerName;
  const orgLines = wrapText(orgName, 16);

  const orgStartY = stampCenterY + 20 + (orgLines.length - 1) * 4;

  orgLines.forEach((line, index) => {
    targetPage.drawText(line, {
      x: stampCenterX - (line.length * 2.5),
      y: orgStartY - (index * 8),
      size: 8,
      color: stampColor,
      font: boldFont,
      opacity: 1
    });
  });

  // Добавляем текст "ЄДРПОУ/ІПН" на украинском
  const edrpouText = "ЄДРПОУ/ІПН";
  const edrpouY = stampCenterY + 2;

  targetPage.drawText(edrpouText, {
    x: stampCenterX - (edrpouText.length * 2),
    y: edrpouY,
    size: 6,
    color: stampColor,
    font: font,
    opacity: 1
  });

  // Обработка ИНН
  const inn = data.signerINN;
  const innLines = wrapText(inn, 12);

  const innStartY = stampCenterY - 10 - (innLines.length - 1) * 4;

  innLines.forEach((line, index) => {
    targetPage.drawText(line, {
      x: stampCenterX - (line.length * 2),
      y: innStartY - (index * 7),
      size: 8,
      color: stampColor,
      font: font,
      opacity: 1
    });
  });

  // // Добавляем имя подписанта (если есть) - БЕЗ транслитерации
  // if (data.signerName && data.signerPosition !== 'Директор') {
  //   const signerName = data.signerName;
  //   const nameLines = wrapText(signerName, 14);

  //   const nameStartY = stampCenterY - 25 - (nameLines.length - 1) * 4;

  //   nameLines.forEach((line, index) => {
  //     targetPage.drawText(line, {
  //       x: stampCenterX - (line.length * 2),
  //       y: nameStartY - (index * 6),
  //       size: 6,
  //       color: stampColor,
  //       font: font,
  //       opacity: 1
  //     });
  //   });
  // }

  // // Добавляем должность (если есть) - БЕЗ транслитерации
  // if (data.signerPosition && data.signerPosition !== "") {
  //   const position = data.signerPosition;
  //   const positionLines = wrapText(position, 12);

  //   const positionStartY = stampCenterY - 40 - (positionLines.length - 1) * 4;

  //   positionLines.forEach((line, index) => {
  //     targetPage.drawText(line, {
  //       x: stampCenterX - (line.length * 1.8),
  //       y: positionStartY - (index * 5),
  //       size: 5,
  //       color: stampColor,
  //       font: font,
  //       opacity: 1
  //     });
  //   });
  // }

  // Добавляем уникальный маркер для подсчета печатей в будущем
  targetPage.drawText(`STAMP_${existingStampsCount + 1}`, {
    x: stampCenterX + stampRadius - 20,
    y: stampCenterY - stampRadius + 5,
    size: 4,
    color: stampColor,
    font: font,
    opacity: 0.3
  });

  return await pdfDoc.save();
}
