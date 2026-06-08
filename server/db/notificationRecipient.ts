import { prisma } from "~/server/db/index";

export const getNotificationRecipients = async () => {
	return prisma.notificationRecipient.findMany({
		orderBy: { createdAt: "asc" },
	});
};

export const getEnabledNotificationRecipients = async () => {
	return prisma.notificationRecipient.findMany({
		where: { enabled: true },
		select: { id: true, email: true },
	});
};

export const createNotificationRecipient = async (data: { email: string; label?: string | null }) => {
	return prisma.notificationRecipient.create({
		data: {
			email: data.email,
			label: data.label ?? null,
		},
	});
};

export const updateNotificationRecipient = async (
	id: number,
	data: { email?: string; label?: string | null; enabled?: boolean },
) => {
	return prisma.notificationRecipient.update({
		where: { id },
		data,
	});
};

export const deleteNotificationRecipient = async (id: number) => {
	return prisma.notificationRecipient.delete({
		where: { id },
	});
};
