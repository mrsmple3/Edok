import {prisma} from "~/server/db/index";
import {EventHandlerRequest, H3Event} from "h3";

export const getAllLeads = async () => {
    return prisma.lead.findMany(
        {
            include: {
                documents: true,
            }
        }
    );
}

export const getLeadById = async (id: number) => {
    return prisma.lead.findUnique({
        where: { id },
        include: {
            documents: true,
        }
    });
}

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
        },
    });

    return leads;
}

export const createLead = async (event: H3Event<EventHandlerRequest>, data: any) => {
    return prisma.lead.create({
        data: {
            type: data.type,
            quantity: data.quantity,
            author: {connect: {id: data.authorId}},
            moderators: {connect: {id: data.moderatorsId}},
            contragent: {connect: {id: data.contragentId}},
            documents: {
                connect: data.documents.map((documentId: number) => ({ id: documentId }))
            },
        },
    });
}

export const updateLead = async (id: number, data: any) => {
    return prisma.lead.update({
        where: { id },
        data: {
            type: data.type,
            quantity: data.quantity,
            author: {connect: {id: data.authorId}},
            moderators: {connect: {id: data.moderatorsId}},
            contragent: {connect: {id: data.contragentId}},
            documents: {
                connect: data.documents.map((documentId: number) => ({ id: documentId }))
            },
        }
    });
}

export const deleteLead = async (id: number) => {
    return prisma.lead.delete({
        where: { id }
    });
}

export const deleteLeads = async () => {
    return prisma.lead.deleteMany();
}