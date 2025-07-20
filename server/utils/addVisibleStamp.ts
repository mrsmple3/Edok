import { PDFDocument, rgb, PDFImage, StandardFonts } from 'pdf-lib';

export async function addVisibleStamp(signedPdfBytes: ArrayBuffer, stampImagePath: string): Promise<Uint8Array> {
  // Загружаем подписанный PDF
  const pdfDoc = await PDFDocument.load(signedPdfBytes);

  // Встраиваем шрифт с поддержкой кириллицы
  // Стандартный шрифт Times Roman, который имеет некоторую поддержку кириллицы
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  // Получаем первую страницу
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // Загружаем изображение печати
  const stampImageBytes = await fetch(stampImagePath).then(res => res.arrayBuffer());
  let stampImage: PDFImage;

  try {
    stampImage = await pdfDoc.embedPng(stampImageBytes);
  } catch {
    try {
      stampImage = await pdfDoc.embedJpg(stampImageBytes);
    } catch (err) {
      console.error('Не удалось загрузить изображение печати:', err);
      return new Uint8Array(signedPdfBytes);
    }
  }

  const { width, height } = firstPage.getSize();
  const stampWidth = width * 0.2;
  const stampHeight = stampWidth * (stampImage.height / stampImage.width);

  firstPage.drawImage(stampImage, {
    x: width - stampWidth - 50,
    y: 50,
    width: stampWidth,
    height: stampHeight,
    opacity: 0.9
  });

  // Добавляем текст на английском (так как даже с TimesRoman некоторые кириллические символы могут не отображаться)
  firstPage.drawText('Document is electronically signed', {
    x: width - stampWidth - 50,
    y: 50 + stampHeight + 10,
    size: 12,
    color: rgb(0, 0, 0),
    font: font
  });

  return await pdfDoc.save();
}
