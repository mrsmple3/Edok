import {defineEventHandler} from 'h3';
import {prisma} from '~/server/db';

const checkRole = (role: string) => defineEventHandler(async (event) => {
    const authHeader = event.req.headers['authorization'];

    if (!authHeader) {
        throw createError({statusCode: 401, message: 'Authorization header is missing'});
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        throw createError({statusCode: 401, message: 'Unauthorized'});
    }

    const config = useRuntimeConfig();
    try {
        const decoded = decodeAccessToken(token);
        const user = await prisma.user.findUnique({
            where: {id: decoded.userId},
        });

        if (!user || user.role !== role) {
            throw createError({statusCode: 403, message: 'Forbidden'});
        }

        event.context.user = user;
    } catch (error) {
        throw createError({statusCode: 401, message: 'Invalid token'});
    }
});

export default checkRole;