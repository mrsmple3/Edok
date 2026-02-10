import { prisma } from "~/server/db/index";
import bcrypt from "bcrypt";
import { User } from "@prisma/client";
import { findOrCreateOrganization } from "~/server/db/organizations";

export const createUser = async (userData: { role: any; phone: any; password_hash: any; email: any }) => {
	const finalUserData = { ...userData, password_hash: bcrypt.hashSync(userData.password_hash, 10), isActive: userData.role === "counterparty" ? false : true };
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
	return prisma.user.findUnique({
		where: { phone },
		include: {
			organization: true,
		},
	});
};

export const updateUser = (id: number, userData: any) => {
	return prisma.user.update({
		where: { id },
		data: userData,
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
