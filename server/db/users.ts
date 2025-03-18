import { prisma } from "~/server/db/index";
import bcrypt from "bcrypt";
import { User } from "@prisma/client";

export const createUser = (userData: { role: any; phone: any; password_hash: any; email: any }) => {
	const finalUserData = { ...userData, password_hash: bcrypt.hashSync(userData.password_hash, 10) };

	return prisma.user.create({
		data: finalUserData,
	});
};

export const getAllUsers = () => {
	return prisma.user.findMany();
};

export const getUserByUsername = (email: string) => {
	return prisma.user.findUnique({
		where: { email },
	});
};

export const getUserByEmail = (email: string) => {
	return prisma.user.findUnique({
		where: { email },
	});
};

export const getUserByPhone = (phone: string) => {
	return prisma.user.findUnique({
		where: { phone },
	});
};

export const updateUser = (id: number, userData: User) => {
	return prisma.user.update({
		where: { id },
		data: userData,
	});
};

export const getUserById = (id: number) => {
	return prisma.user.findUnique({
		where: { id },
	});
};

export const updateUserPassword = (id: number, password: string) => {
	return prisma.user.update({
		where: { id },
		data: { password_hash: bcrypt.hashSync(password, 10) },
	});
};

export const updateUserRole = (id: number, role: string) => {
	return prisma.user.update({
		where: { id },
		data: { role },
	});
};

export const deleteUserById = (id: number) => {
	return prisma.user.delete({
		where: { id },
	});
};
