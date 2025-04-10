import { prisma } from "~/server/db/index";
import { EventHandlerRequest, H3Event } from "h3";
import { Lead } from "@prisma/client";

export const getAllLeads = async () => {
	return prisma.lead.findMany({
		include: {
			author: true,
			documents: true,
			moderators: true,
			counterparty: true,
		},
	});
};

export const getLeadById = async (id: any) => {
	return prisma.lead.findUnique({
		where: { id },
		include: {
			author: true,
			counterparty: true,
			moderators: true,
			documents: true,
		},
	});
};

export const getLeadsByAuthorId = async (authorId: number) => {
	const leads = await prisma.lead.findMany({
		where: {
			authorId: {
				equals: authorId,
			},
		},
		include: {
			author: true,
			documents: true,
			moderators: true,
			counterparty: true,
		},
	});

	return leads;
};

export const getLeadsByCounterpartyId = async (counterpartyId: number) => {
	const leads = await prisma.lead.findMany({
		where: {
			counterpartyId: {
				equals: counterpartyId,
			},
		},
		include: {
			author: true,
			documents: true,
			moderators: true,
			counterparty: true,
		},
	});

	return leads;
};

export const getLeadsByModeratorId = async (moderatorId: number) => {
	const leads = await prisma.lead.findMany({
		where: {
			moderatorsId: {
				equals: moderatorId,
			},
		},
		include: {
			author: true,
			documents: true,
			moderators: true,
			counterparty: true,
		},
	});

	return leads;
};

export const createLead = async (event: H3Event<EventHandlerRequest>, data: any) => {
	return prisma.lead.create({
		data: {
			name: data.name,
			type: data.type,
			author: { connect: { id: data.authorId } },
			counterparty: data.counterpartyId ? { connect: { id: data.counterpartyId } } : undefined,
			moderators: data.moderatorsId ? { connect: { id: data.moderatorsId } } : undefined,
			documents: {
				connect: data.documents.map((documentId: number) => ({ id: documentId })),
			},
		},
		include: {
			author: true,
			counterparty: true,
			moderators: true,
			documents: true,
		},
	});
};

export const updateLead = async (id: number, data: any) => {
	return prisma.lead.update({
		where: { id },
		data: {
			name: data.name,
			type: data.type,
			counterparty: data.counterpartyId ? { connect: { id: data.counterpartyId } } : undefined,
			moderators: data.moderatorsId ? { connect: { id: data.moderatorsId } } : undefined,
			documents: {
				connect: data.documents ? data.documents.map((documentId: number) => ({ id: documentId })) : undefined,
			},
		},
		include: {
			author: true,
			counterparty: true,
			moderators: true,
			documents: true,
		},
	});
};

export const deleteLead = async (id: number) => {
	return prisma.lead.delete({
		where: { id },
	});
};

export const deleteLeads = async () => {
	return prisma.lead.deleteMany();
};
