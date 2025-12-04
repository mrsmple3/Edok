export const DOCUMENT_TYPES_WITHOUT_SIGNATURE = [
	"Підтверджуючі",
	"Товарно-транспортна накладна",
] as const;

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
