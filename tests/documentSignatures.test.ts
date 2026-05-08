import test from 'node:test';
import assert from 'node:assert/strict';

import { getLatestSignature, getLatestStampedFilePath, sortSignaturesByCreatedAt } from '../lib/documents';

test('sortSignaturesByCreatedAt orders signatures by createdAt and id', () => {
  const sorted = sortSignaturesByCreatedAt([
    { id: 3, createdAt: '2026-04-07T06:38:49.000Z', stampedFile: '/3.pdf' },
    { id: 1, createdAt: '2026-04-07T06:38:47.000Z', stampedFile: '/1.pdf' },
    { id: 2, createdAt: '2026-04-07T06:38:47.000Z', stampedFile: '/2.pdf' },
  ]);

  assert.deepEqual(sorted.map((signature) => signature.id), [1, 2, 3]);
});

test('getLatestSignature returns the newest signature even when input order is unstable', () => {
  const latest = getLatestSignature([
    { id: 7864, createdAt: '2026-04-07T06:38:50.000Z', stampedFile: '/latest.pdf' },
    { id: 7861, createdAt: '2026-04-07T06:38:46.864Z', stampedFile: '/first.pdf' },
    { id: 7863, createdAt: '2026-04-07T06:38:49.000Z', stampedFile: '/third.pdf' },
  ]);

  assert.equal(latest?.id, 7864);
  assert.equal(latest?.stampedFile, '/latest.pdf');
});

test('getLatestStampedFilePath returns the newest available stamped file instead of the last array element', () => {
  const stampedFile = getLatestStampedFilePath([
    { id: 7864, createdAt: '2026-04-07T06:38:50.000Z', stampedFile: '/uploads/fourth.pdf' },
    { id: 7861, createdAt: '2026-04-07T06:38:46.864Z', stampedFile: '/uploads/first.pdf' },
    { id: 7862, createdAt: '2026-04-07T06:38:48.000Z', stampedFile: '/uploads/second.pdf' },
  ]);

  assert.equal(stampedFile, '/uploads/fourth.pdf');
});
