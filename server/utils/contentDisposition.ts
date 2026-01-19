import type { H3Event } from 'h3';
import { setHeader } from 'h3';

export function sanitizeFileName(filename: string | undefined | null): string {
	if (!filename || typeof filename !== 'string') {
		return 'document';
	}

	const normalized = filename
		.normalize('NFKD')
		.replace(/\r|\n|\t/g, ' ')
		.replace(/[^\p{L}\p{N}\s\-_\.]/gu, '')
		.replace(/\s+/g, '_')
		.replace(/_+/g, '_')
		.replace(/^_+|_+$/g, '')
		.substring(0, 50);

	return normalized || 'document';
}

export function buildContentDispositionHeader(filename: string): string {
	const asciiFallback = filename
		.normalize('NFKD')
		.replace(/[^\x20-\x7E]/g, '_')
		.replace(/[\"\\]/g, '')
		.replace(/_+/g, '_')
		.replace(/^_+|_+$/g, '') || 'download.pdf';

	const encoded = encodeRFC5987ValueChars(filename);
	const candidate = `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;

	return ensureAsciiHeaderValue(candidate) || 'attachment; filename="download.pdf"';
}

export function setContentDispositionHeader(
	event: H3Event,
	filename: string,
	fallbackFileName: string = 'download.pdf',
) {
	const safeHeader = buildContentDispositionHeader(filename);

	try {
		setHeader(event, 'Content-Disposition', safeHeader);
	} catch (error) {
		console.warn('Warning: invalid Content-Disposition header detected, using safe fallback', error);
		setHeader(event, 'Content-Disposition', `attachment; filename="${fallbackFileName}"`);
	}
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
