import {prisma} from "~/server/db/index";
import bcrypt from 'bcrypt';

export const createUser = (userData) => {
    const finalUserData = {...userData, password: bcrypt.hashSync(userData.password, 10)}

    return prisma.user.create({
        data: finalUserData,
    })
}

export const getUserByUsername = (email: string) => {
    return prisma.user.findUnique({
        where: {email}
    });
}

export const updateUser = (id: string, userData) => {
    return prisma.user.update({
        where: {id},
        data: userData
    })
}

export const getUserById = (id: string) => {
    return prisma.user.findUnique({
        where: {id}
    })
}

export const updateUserPassword = (id: string, password: string) => {
    return prisma.user.update({
        where: {id},
        data: {password: bcrypt.hashSync(password, 10)}
    })
}