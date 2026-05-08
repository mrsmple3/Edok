import { prisma } from "~/server/db/index";
import bcrypt from "bcrypt";
import { findOrCreateOrganization } from "~/server/db/organizations";
import { normalizeEmail, normalizePhone, normalizePhoneForStorage } from "~/lib/authIdentifier";

export const createUser = async (userData: { role: any; phone: any; password_hash: any; email: any }) => {
	const finalUserData = {
		...userData,
		email: normalizeEmail(userData.email),
		phone: normalizePhoneForStorage(userData.phone),
		password_hash: bcrypt.hashSync(userData.password_hash, 10),
		isActive: userData.role === "counterparty" ? false : true
	};
	let organizationId = userData.organizationId;

	if (!organizationId && userData.role !== "counterparty" && (userData.organization_name || userData.organization_INN)) {
		const org = await findOrCreateOrganization({
			name: userData.organization_name,
			inn: userData.organization_INN,
		});
		organizationId = org?.id;
	}

	return prisma.user.create({
		data: {
			...finalUserData,
			organizationId,
		},
		include: {
			organization: true,
		},
	});
};

export const getAllUsers = () => {
	return prisma.user.findMany({
		include: {
			organization: true,
		},
	});
};

export const getUserByUsername = (email: string) => {
	return prisma.user.findUnique({
		where: { email },
		include: {
			organization: true,
		},
	});
};

export const getUserByEmail = (email: string) => {
	return prisma.user.findUnique({
		where: { email },
		include: {
			organization: true,
		},
	});
};

export const getUserByPhone = (phone: string) => {
	const normalizedPhone = normalizePhone(phone);

	if (!normalizedPhone) {
		return null;
	}

	return prisma.user.findUnique({
		where: { phone: normalizedPhone },
		include: {
			organization: true,
		},
	}).then(async (directUser) => {
		if (directUser) {
			return directUser;
		}

		const users = await prisma.user.findMany({
			where: {
				phone: {
					not: null,
				},
			},
			include: {
				organization: true,
			},
		});

		return users.find((user) => normalizePhone(user.phone) === normalizedPhone) ?? null;
	});
};

export const updateUser = (id: number, userData: any) => {
	return prisma.user.update({
		where: { id },
		data: {
			...userData,
			email: Object.prototype.hasOwnProperty.call(userData, "email") ? normalizeEmail(userData.email) : userData.email,
			phone: Object.prototype.hasOwnProperty.call(userData, "phone") ? normalizePhoneForStorage(userData.phone) : userData.phone,
		},
		include: {
			organization: true,
		},
	});
};

export const getUserById = (id: number) => {
	return prisma.user.findUnique({
		where: { id },
		include: {
			organization: true,
		},
	});
};

export const updateUserPassword = (id: number, password: string) => {
	return prisma.user.update({
		where: { id },
		data: { password_hash: bcrypt.hashSync(password, 10) },
		include: {
			organization: true,
		},
	});
};

export const updateUserRole = (id: number, role: string) => {
	return prisma.user.update({
		where: { id },
		data: { role },
		include: {
			organization: true,
		},
	});
};

export const deleteUserById = async (id: number) => {
	await prisma.Signature.deleteMany({
		where: { userId: id }
	});

	await prisma.DocumentDeleteSign.deleteMany({
		where: { userId: id }
	});

	await prisma.Message.deleteMany({
		where: { senderId: id }
	});

	await prisma.document.deleteMany({
		where: { userId: id }
	});

	return prisma.user.delete({
		where: { id },
	});
};

export const getUserByRole = (role: string) => {
	return prisma.user.findMany({
		where: {
			role: role,
		},
		include: {
			organization: true,
		},
	});
};

export const checkRoleUser = (role: string) => {
	if (role === "admin" || role === "moderator" || role === "counterparty" || role === "lawyer" || role === "boogalter") {
		return true;
	}
	return false;
};

export const changePassword = async (userId: number, oldPassword: string, newPassword: string) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
	});

	if (user && bcrypt.compareSync(oldPassword, user.password_hash)) {
		return prisma.user.update({
			where: { id: userId },
			data: { password_hash: bcrypt.hashSync(newPassword, 10) },
		});
	}
	return false;
}
