import {prisma} from "~/server/db/index";

export const createOrUpdateRefreshToken = async (data: any) => {
    const existingToken = await prisma.refreshToken.findUnique({
        where: {token: data.token},
    });

    if (existingToken) {
        return prisma.refreshToken.update({
            where: {token: data.token},
            data: {
                userId: data.userId,
            },
        });
    } else {
        return prisma.refreshToken.create({
            data: {
                token: data.token,
                userId: data.userId,
            },
        });
    }
};

export const getRefreshTokenByToken = (token: any) => {
    return prisma.refreshToken.findUnique({
        where: {
            token
        }
    })
}

export const removeRefreshToken = (token: any) => {
    return prisma.refreshToken.delete({
        where: {
            token
        }
    })
}