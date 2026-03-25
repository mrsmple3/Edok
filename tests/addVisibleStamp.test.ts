import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

import { addVisibleStamp } from '../server/utils/addVisibleStamp';

async function createPdf(pageWidth = 595, pageHeight = 842) {
  const pdf = await PDFDocument.create();
  pdf.addPage([pageWidth, pageHeight]);
  return pdf.save();
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 2000): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

const baseStampData = {
  organizationName: 'ТОВ Агро Едок',
  signerINN: '1234567890',
  signerName: 'Іван Петренко',
  signerPosition: 'Менеджер',
  stampCount: 0,
};

test('adds the first visible stamp on the existing page', async () => {
  const sourcePdf = await createPdf();
  const stampedPdf = await withTimeout(addVisibleStamp(sourcePdf.buffer as ArrayBuffer, baseStampData));
  const resultPdf = await PDFDocument.load(stampedPdf);

  assert.equal(resultPdf.getPageCount(), 1);
});

test('creates a second page when stampCount targets the next page', async () => {
  const sourcePdf = await createPdf();
  const stampedPdf = await withTimeout(
    addVisibleStamp(sourcePdf.buffer as ArrayBuffer, {
      ...baseStampData,
      stampCount: 4,
    })
  );
  const resultPdf = await PDFDocument.load(stampedPdf);

  assert.equal(resultPdf.getPageCount(), 2);
});

test('keeps four visible stamps on the first page', async () => {
  const sourcePdf = await createPdf();
  const stampedPdf = await withTimeout(
    addVisibleStamp(sourcePdf.buffer as ArrayBuffer, {
      ...baseStampData,
      stampCount: 3,
    })
  );
  const resultPdf = await PDFDocument.load(stampedPdf);

  assert.equal(resultPdf.getPageCount(), 1);
});

test('sanitizes invalid stampCount values', async () => {
  const sourcePdf = await createPdf();
  const cases = [undefined, -1, Number.NaN, 'junk'];

  for (const stampCount of cases) {
    const stampedPdf = await withTimeout(
      addVisibleStamp(sourcePdf.buffer as ArrayBuffer, {
        ...baseStampData,
        stampCount: stampCount as never,
      })
    );
    const resultPdf = await PDFDocument.load(stampedPdf);
    assert.equal(resultPdf.getPageCount(), 1);
  }
});

test('throws a handled error for invalid PDF input', async () => {
  await assert.rejects(
    () => withTimeout(addVisibleStamp(new ArrayBuffer(0), baseStampData)),
    /empty PDF payload/
  );
});
