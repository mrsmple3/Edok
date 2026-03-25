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

function normalizeStampCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
}

export async function addVisibleStamp(signedPdfBytes: ArrayBuffer, stampData: StampData): Promise<Uint8Array> {
  if (!(signedPdfBytes instanceof ArrayBuffer) || signedPdfBytes.byteLength === 0) {
    throw new Error('Cannot add visible stamp to an empty PDF payload');
  }

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(signedPdfBytes);
  } catch (error) {
    throw new Error(`Cannot load PDF for visible stamp: ${error instanceof Error ? error.message : String(error)}`);
  }

  pdfDoc.registerFontkit(fontkit);

  // Загружаем шрифт, который поддерживает кириллицу
  let font;
  let boldFont;
  try {
    // Попытка загрузить TTF шрифт с поддержкой кириллицы
    const fontPath = path.resolve(process.cwd(), 'public/fonts/DejaVuSans.ttf');
    const boldFontPath = path.resolve(process.cwd(), 'public/fonts/DejaVuSans-Bold.ttf');

    // Проверяем существование файлов
    if (!fs.existsSync(fontPath)) {
      throw new Error(`Файл шрифта не найден: ${fontPath}`);
    }

    if (!fs.existsSync(boldFontPath)) {
      throw new Error(`Файл жирного шрифта не найден: ${boldFontPath}`);
    }

    const fontBytes = fs.readFileSync(fontPath);
    font = await pdfDoc.embedFont(fontBytes);

    const boldFontBytes = fs.readFileSync(boldFontPath);
    boldFont = await pdfDoc.embedFont(boldFontBytes);

  } catch {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  // Получаем все страницы
  const pages = pdfDoc.getPages();
  if (pages.length === 0) {
    throw new Error('Cannot add visible stamp to a PDF without pages');
  }

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

  const fitTextLines = (
    text: string,
    textFont: any,
    initialSize: number,
    maxWidth: number,
    maxLines: number,
    minSize: number
  ) => {
    const normalizedText = (text || '').replace(/\s+/g, ' ').trim();
    if (!normalizedText) {
      return { lines: [], fontSize: initialSize };
    }

    let fontSize = initialSize;

    while (fontSize >= minSize) {
      const words = normalizedText.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      const pushChunkedWord = (word: string) => {
        let rest = word;
        while (rest) {
          let chunk = '';

          for (const char of rest) {
            const next = `${chunk}${char}`;
            if (textFont.widthOfTextAtSize(next, fontSize) <= maxWidth || chunk.length === 0) {
              chunk = next;
            } else {
              break;
            }
          }

          if (!chunk) {
            chunk = rest[0];
          }

          lines.push(chunk);
          rest = rest.slice(chunk.length);
        }
      };

      for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (textFont.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
          currentLine = candidate;
          continue;
        }

        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }

        if (textFont.widthOfTextAtSize(word, fontSize) <= maxWidth) {
          currentLine = word;
        } else {
          pushChunkedWord(word);
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      if (lines.length <= maxLines && lines.every((line) => textFont.widthOfTextAtSize(line, fontSize) <= maxWidth)) {
        return { lines, fontSize };
      }

      fontSize -= 0.5;
    }

    return {
      lines: wrapText(normalizedText, Math.max(6, Math.floor(maxWidth / Math.max(minSize * 0.55, 1)))).slice(0, maxLines),
      fontSize: minSize,
    };
  };

  const drawCenteredLines = (
    lines: string[],
    textFont: any,
    fontSize: number,
    centerX: number,
    topY: number,
    lineHeight: number,
    color: ReturnType<typeof rgb>
  ) => {
    lines.forEach((line, index) => {
      const textWidth = textFont.widthOfTextAtSize(line, fontSize);
      targetPage.drawText(line, {
        x: centerX - (textWidth / 2),
        y: topY - (index * lineHeight),
        size: fontSize,
        color,
        font: textFont,
        opacity: 1
      });
    });
  };

  // Упрощенная логика размещения печатей
  const stampRadius = 60;
  const margin = 30;
  const stampDiameter = stampRadius * 2;
  const stampSpacing = 10;

  // Подсчитываем сколько печатей помещается в строку
  const availableWidth = width - (margin * 2);
  const stampsPerRow = Math.floor((availableWidth + stampSpacing) / (stampDiameter + stampSpacing));
  if (stampsPerRow < 1) {
    throw new Error(`Visible stamp cannot fit on the page width ${width}`);
  }

  // Подсчет существующих печатей
  const existingStampsCount = normalizeStampCount(stampData.stampCount);

  // Определяем страницу и позицию
  const targetPageIndex = Math.floor(existingStampsCount / stampsPerRow);
  const positionInRow = existingStampsCount % stampsPerRow;

  // Создаем новые страницы если нужно
  while (pdfDoc.getPageCount() <= targetPageIndex) {
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
    size: stampRadius - 9,
    borderColor: stampColor,
    borderWidth: 1,
    opacity: 0.6
  });

  // Обработка названия организации (БЕЗ транслитерации!)
  const orgName = data.signerPosition === 'Директор' ? data.signerName : data.organizationName || data.signerName;
  const contentMaxWidth = (stampRadius - 14) * 2;
  const orgBlock = fitTextLines(orgName, boldFont, 7, contentMaxWidth, 2, 5.5);
  const orgLineHeight = orgBlock.fontSize + 1.5;
  const orgTopY = stampCenterY + 18 + ((orgBlock.lines.length - 1) * orgLineHeight / 2);

  drawCenteredLines(
    orgBlock.lines,
    boldFont,
    orgBlock.fontSize,
    stampCenterX,
    orgTopY,
    orgLineHeight,
    stampColor
  );

  // Добавляем текст "ЄДРПОУ/ІПН" на украинском
  const edrpouText = "ЄДРПОУ/ІПН";
  const edrpouSize = 5.5;
  const edrpouWidth = font.widthOfTextAtSize(edrpouText, edrpouSize);
  const edrpouY = stampCenterY + 1;

  targetPage.drawText(edrpouText, {
    x: stampCenterX - (edrpouWidth / 2),
    y: edrpouY,
    size: edrpouSize,
    color: stampColor,
    font: font,
    opacity: 1
  });

  // Обработка ИНН
  const inn = data.signerINN;
  const innBlock = fitTextLines(inn, font, 7, contentMaxWidth - 4, 2, 5.5);
  const innLineHeight = innBlock.fontSize + 1.5;
  const innTopY = stampCenterY - 11 + ((innBlock.lines.length - 1) * innLineHeight / 2);

  drawCenteredLines(
    innBlock.lines,
    font,
    innBlock.fontSize,
    stampCenterX,
    innTopY,
    innLineHeight,
    stampColor
  );

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
    x: stampCenterX + stampRadius - 24,
    y: stampCenterY - stampRadius + 8,
    size: 4,
    color: stampColor,
    font: font,
    opacity: 0.3
  });

  return await pdfDoc.save();
}
