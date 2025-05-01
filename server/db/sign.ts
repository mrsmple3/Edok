import Id from "~/pages/document/[id].vue";
import { prisma } from "~/server/db/index";


export const getAllSigns = () => {
  return prisma.signature.findMany();
};

export const getSignByDocumentId = (id: number) => {
  return prisma.signature.findFirst({
    where: {
      documentId: id,
    }
  });
};

export const getSignByUserId = (userId: number) => {
  return prisma.signature.findMany({
    where: {
      userId: userId,
    }
  });
}

export const createSign = (data: any) => {
  return prisma.signature.create({
    data: {
      signature: data.signature,
      documentId: data.documentId,
      userId: data.userId,
      user: {
        connect: { id: data.userId }
      },
      document: {
        connect: { id: data.documentId }
      }
    }
  })
}

export const updateSing = (data: any) => {
  return prisma.signature.update({
    where: {
      id: data.id,
    },
    data: {
      signature: data.signature,
      documentId: data.documentId,
      userId: data.userId,
    }
  });
}

export const deleteSignById = (id: number) => {
  return prisma.signature.delete({
    where: {
      id: id,
    }
  });
}
