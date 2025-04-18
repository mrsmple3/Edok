import { prisma } from ".";


export const postMessage = async (data: any) => {
  return await prisma.message.create({
    data: {
      content: data.content,
      senderId: data.senderId,
      room: data.room,
    },
  });
}


export const getAllMessage = async () => {
  return await prisma.message.findMany();
}

export const getMessageByRoom = async (room: string) => {
  return await prisma.message.findMany({
    where: {
      room,
    }
  });
}

export const getBySenderIdMessage = async (senderId: number) => {
  return await prisma.message.findMany({
    where: {
      senderId,
    },
  });
}
