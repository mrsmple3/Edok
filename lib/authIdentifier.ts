const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PHONE_MASK = "+###(##) ###-##-##";

export function normalizeEmail(value?: string | null): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	return trimmedValue ? trimmedValue : null;
}

export function isValidEmail(value?: string | null): boolean {
	const normalizedValue = normalizeEmail(value);
	return normalizedValue ? EMAIL_REGEX.test(normalizedValue) : false;
}

export function normalizePhone(value?: string | null): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	if (!trimmedValue) {
		return null;
	}

	const digitsOnly = trimmedValue.replace(/\D/g, "");
	if (digitsOnly.length < 10 || digitsOnly.length > 15) {
		return null;
	}

	return `+${digitsOnly}`;
}

export function isValidPhone(value?: string | null): boolean {
	return Boolean(normalizePhone(value));
}

export function isPhoneLikeInput(value?: string | null): boolean {
	if (typeof value !== "string") {
		return false;
	}

	const trimmedValue = value.trim();
	if (!trimmedValue || trimmedValue.includes("@")) {
		return false;
	}

	return /^[+\d]/.test(trimmedValue);
}

export function normalizePhoneForStorage(value?: string | null): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	if (!trimmedValue) {
		return null;
	}

	return normalizePhone(trimmedValue) ?? trimmedValue;
}
