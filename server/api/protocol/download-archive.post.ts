import { defineEventHandler, readBody, setHeader } from 'h3';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { promises as fs } from 'fs';
import path from 'path';

const FONT_PATHS = {
  regular: path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans.ttf'),
  bold: path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans-Bold.ttf')
};

const fontCache: { regular?: Uint8Array; bold?: Uint8Array } = {};

async function getFontBytes(type: keyof typeof FONT_PATHS) {
  if (!fontCache[type]) {
    fontCache[type] = await fs.readFile(FONT_PATHS[type]);
  }
  return fontCache[type]!;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { signatures, documentTitle, documentFilePath } = body;

    console.log('📦 Создание единого PDF с протоколами и документом:', {
      signaturesCount: signatures?.length,
      documentTitle,
      hasFilePath: !!documentFilePath
    });

    if (!signatures || signatures.length === 0) {
      throw new Error('Немає підписів для створення файлу');
    }

    // Создаем ОДИН PDF со всеми протоколами и документом
    console.log(`📄 Генерация единого PDF со всеми протоколами (${signatures.length} шт.) + документ`);

    let signedDocumentBytes: Uint8Array | null = null;

    // Загружаем подписанный документ
    if (signatures.length > 0) {
      const lastSignature = signatures[signatures.length - 1];

      if (lastSignature.stampedFile) {
        try {
          let documentUrl = lastSignature.stampedFile;

          if (!documentUrl.startsWith('http')) {
            const baseUrl = process.env.NODE_ENV === 'production'
              ? 'https://agroedoc.com'
              : 'http://localhost:3002';
            documentUrl = `${baseUrl}${documentUrl.startsWith('/') ? '' : '/'}${documentUrl}`;
          }

          const documentResponse = await fetch(documentUrl);
          if (documentResponse.ok) {
            const documentBuffer = await documentResponse.arrayBuffer();
            signedDocumentBytes = new Uint8Array(documentBuffer);
            console.log('✅ Подписанный документ загружен');
          } else {
            console.error('Ошибка загрузки документа, статус:', documentResponse.status);
          }
        } catch (error) {
          console.error('Ошибка загрузки подписанного документа:', error);
        }
      } else if (documentFilePath) {
        try {
          const fullPath = path.join(process.cwd(), 'public', documentFilePath);
          signedDocumentBytes = await fs.readFile(fullPath);
          console.log('✅ Оригинальный документ загружен');
        } catch (error) {
          console.error('Ошибка загрузки оригинального документа:', error);
        }
      }
    }

    // Генерируем единый PDF с протоколами и документом
    const combinedPdfBytes = await generateCombinedPDF(signatures, documentTitle, signedDocumentBytes);

    console.log(`✅ Единый PDF создан, размер: ${combinedPdfBytes.length} байт`);

    // Устанавливаем заголовки для скачивания
    const safeTitle = sanitizeFileName(documentTitle);
    const fileName = `protocols_and_document_${safeTitle}_${formatDate(new Date().toISOString())}.pdf`;
    const disposition = buildContentDispositionHeader(fileName);

    setHeader(event, 'Content-Type', 'application/pdf');
    try {
      setHeader(event, 'Content-Disposition', disposition);
    } catch (headerError) {
      console.warn('⚠️ Invalid Content-Disposition header detected, using safe fallback', headerError);
      setHeader(event, 'Content-Disposition', 'attachment; filename="protocol.pdf"');
    }
    setHeader(event, 'Content-Length', combinedPdfBytes.length.toString());

    return combinedPdfBytes;

  } catch (error: any) {
    console.error('❌ Ошибка создания PDF:', error);
    console.error('❌ Stack trace:', error?.stack);
    console.error('❌ Message:', error?.message);

    throw createError({
      statusCode: 500,
      statusMessage: 'Помилка створення PDF: ' + (error?.message || 'Unknown error')
    });
  }
});

// Функция генерации ЕДИНОГО PDF со ВСЕМИ протоколами И подписанным документом
async function generateCombinedPDF(signatures: any[], documentTitle: string, signedDocumentBytes: Uint8Array | null) {
  try {
    console.log(`🔧 Создание единого PDF с протоколами и документом...`);

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const [regularFontBytes, boldFontBytes] = await Promise.all([
      getFontBytes('regular'),
      getFontBytes('bold')
    ]);

    const font = await pdfDoc.embedFont(regularFontBytes);
    const boldFont = await pdfDoc.embedFont(boldFontBytes);

    const A4_WIDTH = 595;
    const A4_HEIGHT = 842;
    const margin = 50;

    // ЧАСТЬ 1: Сначала добавляем подписанный документ
    if (signedDocumentBytes) {
      try {
        console.log('📄 Добавление подписанного документа в начало PDF...');

        const signedPdf = await PDFDocument.load(signedDocumentBytes);
        const copiedPages = await pdfDoc.copyPages(signedPdf, signedPdf.getPageIndices());

        copiedPages.forEach(page => {
          pdfDoc.addPage(page);
        });

        console.log(`✅ Подписанный документ добавлен в начало (${copiedPages.length} страниц)`);
      } catch (error) {
        console.error('❌ Ошибка добавления подписанного документа:', error);
      }
    }

    // ЧАСТЬ 2: Затем добавляем все протоколы
    for (let index = 0; index < signatures.length; index++) {
      const signature = signatures[index];
      const protocolNumber = index + 1;

      // Добавляем новую страницу для каждого протокола
      const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      let currentY = A4_HEIGHT - margin;

      const addText = (text: string, x: number, y: number, options: any = {}) => {
        const size = options.size || 12;
        const color = options.color || rgb(0, 0, 0);
        const useFont = options.bold ? boldFont : font;

        page.drawText(text, {
          x,
          y,
          size,
          color,
          font: useFont,
        });

        return y - size - (options.lineSpacing || 5);
      };

      // Заголовок протокола
      currentY = addText('Protokol elektronnoho pidpysu', margin, currentY, {
        size: 18,
        color: rgb(0.1, 0.3, 0.6),
        bold: true
      });

      currentY = addText(`#${protocolNumber}`, margin, currentY, { size: 14, bold: true });
      currentY -= 10;

      currentY = addText(`Data stvorennia: ${formatFullDate(new Date().toISOString())}`,
        margin, currentY, { size: 10 }
      );
      currentY -= 20;

      // Информация о документе
      currentY = addText('Dokument:', margin, currentY, { size: 12, bold: true });
      currentY = addText(`  ${documentTitle}`, margin + 10, currentY, { size: 10 });
      currentY -= 20;

      // Информация о подписанте
      if (signature.User) {
        currentY = addText('Informatsiia pro pidpysanta:', margin, currentY, { size: 12, bold: true });
        currentY = addText(`  Korystuvach: ${signature.User.name}`,
          margin + 10, currentY, { size: 10 }
        );
      }

      if (signature.createdAt) {
        currentY = addText(`  Data pidpysu: ${formatFullDate(signature.createdAt)}`,
          margin + 10, currentY, { size: 10 }
        );
      }
      currentY -= 20;

      // Информация о сертификате
      if (signature.info) {
        const sections = parseSignatureInfo(signature.info);

        for (const section of sections) {
          if (currentY < margin + 150) {
            const newPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
            currentY = A4_HEIGHT - margin;
          }

          currentY = addText(section.title, margin, currentY, {
            size: 12,
            bold: true
          });

          for (const item of section.items) {
            if (currentY < margin + 50) {
              const newPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
              currentY = A4_HEIGHT - margin;
            }

            currentY = addText(`- ${item.key}:`, margin + 10, currentY, { size: 10 });
            currentY = addText(`  ${item.value}`, margin + 20, currentY, { size: 9 });
          }

          currentY -= 15;
        }
      }

      // Файлы подписи
      if (currentY < margin + 100) {
        const newPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        currentY = A4_HEIGHT - margin;
      }

      currentY -= 10;
      currentY = addText('Faily pidpysu:', margin, currentY, { size: 12, bold: true });

      if (signature.signature) {
        currentY = addText('- Fail elektronnoho pidpysu (.p7s)',
          margin, currentY, { size: 11 }
        );
        currentY = addText(`  ${signature.signature}`,
          margin + 10, currentY, { size: 9 }
        );
      }

      if (signature.stampedFile) {
        currentY = addText('- Pidpysanyi dokument z pechatkoiu',
          margin, currentY, { size: 11 }
        );
        currentY = addText(`  ${signature.stampedFile}`,
          margin + 10, currentY, { size: 9 }
        );
      }

      currentY -= 20;

      // Подвал
      addText('Protokol zgenerovano avtomatychno systemoiu elektronnoho dokumentoobihu',
        margin, currentY, {
        size: 10,
        color: rgb(0.5, 0.5, 0.5)
      });

      console.log(`✅ Протокол ${protocolNumber}/${signatures.length} добавлен в PDF`);
    }

    console.log(`✅ Единый PDF с документом и всеми протоколами успешно создан`);
    return await pdfDoc.save();
  } catch (error: any) {
    console.error(`❌ Ошибка создания единого PDF:`, error);
    console.error(`❌ Stack:`, error?.stack);
    throw error;
  }
}

// Функция генерации ЕДИНОГО PDF со ВСЕМИ протоколами
async function generateAllProtocolsPDF(signatures: any[], documentTitle: string) {
  try {
    console.log(`🔧 Создание единого PDF со всеми протоколами (${signatures.length} шт.)...`);

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const [regularFontBytes, boldFontBytes] = await Promise.all([
      getFontBytes('regular'),
      getFontBytes('bold')
    ]);

    const font = await pdfDoc.embedFont(regularFontBytes);
    const boldFont = await pdfDoc.embedFont(boldFontBytes);

    const A4_WIDTH = 595;
    const A4_HEIGHT = 842;
    const margin = 50;

    // Проходим по всем подписям и добавляем каждую на новую страницу
    for (let index = 0; index < signatures.length; index++) {
      const signature = signatures[index];
      const protocolNumber = index + 1;

      // Добавляем новую страницу для каждого протокола
      const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      let currentY = A4_HEIGHT - margin;

      const addText = (text: string, x: number, y: number, options: any = {}) => {
        const size = options.size || 12;
        const color = options.color || rgb(0, 0, 0);
        const useFont = options.bold ? boldFont : font;

        page.drawText(text, {
          x,
          y,
          size,
          color,
          font: useFont,
        });

        return y - size - (options.lineSpacing || 5);
      };

      // Заголовок
      currentY = addText('Протокол електронного підпису', margin, currentY, {
        size: 18,
        color: rgb(0.1, 0.3, 0.6),
        bold: true
      });

      currentY = addText(`#${protocolNumber}`, margin, currentY, { size: 14, bold: true });
      currentY -= 10;

      currentY = addText(`Дата створення: ${formatFullDate(new Date().toISOString())}`,
        margin, currentY, { size: 10 }
      );
      currentY -= 20;

      // Информация о документе
      currentY = addText('Документ:', margin, currentY, { size: 12, bold: true });
      currentY = addText(`  ${documentTitle}`, margin + 10, currentY, { size: 10 });
      currentY -= 20;

      // Информация о подписанте
      if (signature.User) {
        currentY = addText('Інформація про підписанта:', margin, currentY, { size: 12, bold: true });
        currentY = addText(`  Користувач: ${signature.User.name}`,
          margin + 10, currentY, { size: 10 }
        );
      }

      if (signature.createdAt) {
        currentY = addText(`  Дата підпису: ${formatFullDate(signature.createdAt)}`,
          margin + 10, currentY, { size: 10 }
        );
      }
      currentY -= 20;

      // Информация о сертификате
      if (signature.info) {
        const sections = parseSignatureInfo(signature.info);

        for (const section of sections) {
          // Если места мало на текущей странице, добавляем новую
          if (currentY < margin + 150) {
            const newPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
            currentY = A4_HEIGHT - margin;
          }

          currentY = addText(section.title, margin, currentY, {
            size: 12,
            bold: true
          });

          for (const item of section.items) {
            // Проверяем место на странице
            if (currentY < margin + 50) {
              const newPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
              currentY = A4_HEIGHT - margin;
            }

            currentY = addText(`- ${item.key}:`, margin + 10, currentY, { size: 10 });
            currentY = addText(`  ${item.value}`, margin + 20, currentY, { size: 9 });
          }

          currentY -= 15;
        }
      }

      // Файлы подписи
      if (currentY < margin + 100) {
        const newPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        currentY = A4_HEIGHT - margin;
      }

      currentY -= 10;
      currentY = addText('Файли підпису:', margin, currentY, { size: 12, bold: true });

      if (signature.signature) {
        currentY = addText('- Файл електронного підпису (.p7s)',
          margin, currentY, { size: 11 }
        );
        currentY = addText(`  ${signature.signature}`,
          margin + 10, currentY, { size: 9 }
        );
      }

      if (signature.stampedFile) {
        currentY = addText('- Підписаний документ з печаткою',
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
      });

      console.log(`✅ Протокол ${protocolNumber}/${signatures.length} добавлен в PDF`);
    }

    console.log(`✅ Единый PDF со всеми протоколами успешно создан`);
    return await pdfDoc.save();

  } catch (error: any) {
    console.error(`❌ Ошибка создания единого PDF с протоколами:`, error);
    console.error(`❌ Stack:`, error?.stack);
    throw error;
  }
}

// Функция генерации PDF протокола (из generate.post.ts)
async function generateProtocolPDF(signature: any, protocolNumber: number, documentTitle: string) {
  try {
    console.log(`🔧 Создание PDF для протокола #${protocolNumber}...`);

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const [regularFontBytes, boldFontBytes] = await Promise.all([
      getFontBytes('regular'),
      getFontBytes('bold')
    ]);

    const font = await pdfDoc.embedFont(regularFontBytes);
    const boldFont = await pdfDoc.embedFont(boldFontBytes);

    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    const margin = 50;
    let currentY = height - margin;

    const addText = (text: string, x: number, y: number, options: any = {}) => {
      const size = options.size || 12;
      const color = options.color || rgb(0, 0, 0);
      const useFont = options.bold ? boldFont : font;

      page.drawText(text, {
        x,
        y,
        size,
        color,
        font: useFont,
      });

      return y - size - (options.lineSpacing || 5);
    };

    // Заголовок
    currentY = addText('Протокол електронного підпису', margin, currentY, {
      size: 18,
      color: rgb(0.1, 0.3, 0.6),
      bold: true
    });

    currentY = addText(`#${protocolNumber}`, margin, currentY, { size: 14, bold: true });
    currentY -= 10;

    currentY = addText(`Дата створення: ${formatFullDate(new Date().toISOString())}`,
      margin, currentY, { size: 10 }
    );
    currentY -= 20;

    // Информация о документе
    currentY = addText('Документ:', margin, currentY, { size: 12, bold: true });
    currentY = addText(`  ${documentTitle}`, margin + 10, currentY, { size: 10 });
    currentY -= 20;

    // Информация о подписанте
    if (signature.User) {
      currentY = addText('Інформація про підписанта:', margin, currentY, { size: 12, bold: true });
      currentY = addText(`  Користувач: ${signature.User.name}`,
        margin + 10, currentY, { size: 10 }
      );
    }

    if (signature.createdAt) {
      currentY = addText(`  Дата підпису: ${formatFullDate(signature.createdAt)}`,
        margin + 10, currentY, { size: 10 }
      );
    }
    currentY -= 20;

    // Информация о сертификате
    if (signature.info) {
      const sections = parseSignatureInfo(signature.info);

      for (const section of sections) {
        currentY = addText(section.title, margin, currentY, {
          size: 12,
          bold: true
        });

        for (const item of section.items) {
          if (currentY < margin + 50) {
            // Добавляем новую страницу если места мало
            const newPage = pdfDoc.addPage([595, 842]);
            currentY = height - margin;
          }

          currentY = addText(`- ${item.key}:`, margin + 10, currentY, { size: 10 });
          currentY = addText(`  ${item.value}`, margin + 20, currentY, { size: 9 });
        }

        currentY -= 15;
      }
    }

    // Файлы подписи
    currentY -= 10;
    currentY = addText('Файли підпису:', margin, currentY, { size: 12, bold: true });

    if (signature.signature) {
      currentY = addText('- Файл електронного підпису (.p7s)',
        margin, currentY, { size: 11 }
      );
      currentY = addText(`  ${signature.signature}`,
        margin + 10, currentY, { size: 9 }
      );
    }

    if (signature.stampedFile) {
      currentY = addText('- Підписаний документ з печаткою',
        margin, currentY, { size: 11 }
      );
      currentY = addText(`  ${signature.stampedFile}`,
        margin + 10, currentY, { size: 9 }
      );
    } currentY -= 20;

    // Подвал
    addText('Протокол згенеровано автоматично системою електронного документообігу',
      margin, currentY, {
      size: 10,
      color: rgb(0.5, 0.5, 0.5)
    });

    console.log(`✅ PDF протокола #${protocolNumber} успешно создан`);
    return await pdfDoc.save();

  } catch (error: any) {
    console.error(`❌ Ошибка создания PDF протокола #${protocolNumber}:`, error);
    console.error(`❌ Stack:`, error?.stack);
    throw error;
  }
}

// Вспомогательные функции
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('uk-UA').replace(/\./g, '-');
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('uk-UA');
}

function sanitizeFileName(filename: string | undefined | null): string {
  if (!filename || typeof filename !== 'string') {
    return 'document';
  }

  const normalized = filename
    .normalize('NFKD')
    .replace(/\r|\n|\t/g, ' ')
    .replace(/[^a-zA-Z0-9а-яА-ЯіІїЇєЄ\s\-_\.]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);

  return normalized || 'document';
}

function buildContentDispositionHeader(filename: string): string {
  const asciiFallback = filename
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'protocol.pdf';

  const encoded = encodeRFC5987ValueChars(filename);
  const candidate = `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
  return ensureAsciiHeaderValue(candidate) || 'attachment; filename="protocol.pdf"';
}

function ensureAsciiHeaderValue(value: string): string | null {
  if (!value) {
    return null;
  }

  const cleaned = value
    .replace(/[\r\n]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();

  return cleaned || null;
}

function encodeRFC5987ValueChars(str: string): string {
  return encodeURIComponent(str)
    .replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%(7C|60|5E)/g, (match) => match.toLowerCase());
}

function parseSignatureInfo(info: string) {
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
    console.error('Помилка парсингу сертифіката:', error);
  }

  return sections;
}

function parseSubjectData(data: string): Array<{ key: string; value: string }> {
  const items: Array<{ key: string; value: string }> = [];

  try {
    const cleanData = data.replace(/^Subject:\s*/, '');
    const parts = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < cleanData.length; i++) {
      const char = cleanData[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        current += char;
      } else if (char === ',' && !inQuotes) {
        if (current.trim()) parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) parts.push(current.trim());

    for (const part of parts) {
      if (part.includes('=')) {
        const [key, ...valueParts] = part.split('=');
        let value = valueParts.join('=').trim();

        if (key && value) {
          const cleanKey = key.trim();
          let cleanValue = decodeHexString(value);

          if (cleanValue.includes('/serialNumber=')) {
            const [mainValue, serialPart] = cleanValue.split('/serialNumber=');
            items.push({
              key: formatCertificateFieldName(cleanKey),
              value: mainValue.trim()
            });
            if (serialPart) {
              items.push({
                key: 'ІПН / Серійний номер',
                value: serialPart.trim()
              });
            }
          } else {
            items.push({
              key: formatCertificateFieldName(cleanKey),
              value: cleanValue
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Помилка парсингу Subject:', error);
  }

  return items;
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
      } catch {
        return cleaned;
      }
    }
    return cleaned;
  } catch {
    return hexStr || '';
  }
}

function formatCertificateFieldName(fieldName: string): string {
  const map: { [key: string]: string } = {
    'CN': 'Повне ім\'я / Назва організації',
    'O': 'Організація',
    'OU': 'Підрозділ організації',
    'L': 'Місто',
    'ST': 'Область',
    'C': 'Країна',
    'SN': 'Прізвище',
    'GN': 'Ім\'я та по батькові',
    'serialNumber': 'ІПН / Серійний номер',
    'emailAddress': 'Електронна пошта',
  };
  return map[fieldName] || fieldName;
}
