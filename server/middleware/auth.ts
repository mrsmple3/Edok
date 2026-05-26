import { decodeAccessToken } from '~/server/utils/jwt';
import type { JwtPayload } from 'jsonwebtoken';

// Routes that require a valid JWT access token
const PROTECTED_PREFIXES = [
    '/api/admin/',
    '/api/counterparty/',
    '/api/sign',
    '/api/media',
    '/api/protocol',
    '/api/download',
    '/api/user/',
    '/api/leads',
];

// /api/message is intentionally excluded — the Socket.IO server calls it internally without a token

export default defineEventHandler((event) => {
    const url = event.node.req.url || '';

    if (!PROTECTED_PREFIXES.some(prefix => url.startsWith(prefix))) {
        return;
    }

    const authHeader = event.node.req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const decoded = decodeAccessToken(token) as JwtPayload | null;

    if (!decoded) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    event.context.auth = { userId: decoded.userId };
});
