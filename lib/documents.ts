export const DOCUMENT_TYPES_WITHOUT_SIGNATURE = [
	"Підтверджуючі",
	"Товарно-транспортна накладна",
] as const;

export const DOCUMENT_TYPES_COUNTERPARTY_ONLY = [
	"Гарантійний лист",
] as const;

export const documentRequiresCounterpartySignature = (type?: string | null) => {
	if (!type) {
		return false;
	}

	return DOCUMENT_TYPES_COUNTERPARTY_ONLY.includes(type as (typeof DOCUMENT_TYPES_COUNTERPARTY_ONLY)[number]);
};

export const documentRequiresSignature = (type?: string | null) => {
	if (!type) {
		return true;
	}

	return !DOCUMENT_TYPES_WITHOUT_SIGNATURE.includes(type as (typeof DOCUMENT_TYPES_WITHOUT_SIGNATURE)[number]);
};

export const getInitialDocumentStatus = (type?: string | null) => {
	return documentRequiresSignature(type) ? "В очікуванні" : "Інформаційний";
};

export const getDocumentStatusLabel = (status?: string | null, type?: string | null) => {
	if (!documentRequiresSignature(type)) {
		return "Не потребує підпису";
	}

	return status || "В очікуванні";
};

type SignatureLike = {
	id?: number | null;
	createdAt?: string | Date | null;
	stampedFile?: string | null;
};

const getSignatureTimestamp = (signature?: SignatureLike | null) => {
	if (!signature?.createdAt) {
		return 0;
	}

	const timestamp = new Date(signature.createdAt).getTime();
	return Number.isFinite(timestamp) ? timestamp : 0;
};

export const sortSignaturesByCreatedAt = <T extends SignatureLike>(signatures?: T[] | null): T[] => {
	if (!Array.isArray(signatures) || signatures.length === 0) {
		return [];
	}

	return [...signatures].sort((left, right) => {
		const timestampDiff = getSignatureTimestamp(left) - getSignatureTimestamp(right);
		if (timestampDiff !== 0) {
			return timestampDiff;
		}

		return Number(left?.id || 0) - Number(right?.id || 0);
	});
};

export const getLatestSignature = <T extends SignatureLike>(signatures?: T[] | null): T | null => {
	const sorted = sortSignaturesByCreatedAt(signatures);
	return sorted.length > 0 ? sorted[sorted.length - 1] : null;
};

export const getLatestStampedFilePath = <T extends SignatureLike>(signatures?: T[] | null): string => {
	const sorted = sortSignaturesByCreatedAt(signatures);

	for (let index = sorted.length - 1; index >= 0; index -= 1) {
		const stampedFile = sorted[index]?.stampedFile?.trim();
		if (stampedFile) {
			return stampedFile;
		}
	}

	return "";
};
