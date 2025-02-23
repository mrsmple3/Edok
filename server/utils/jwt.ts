import jwt from 'jsonwebtoken';
import {User} from "@prisma/client";

const generateAccessToken = (user: User) => {
    const config = useRuntimeConfig();
    return jwt.sign({userId: user.id}, config.jwtAccessSecret, {expiresIn: '15m'});
}
const generateRefreshToken = (user: User) => {
    const config = useRuntimeConfig();
    return jwt.sign({userId: user.id}, config.jwtRefreshSecret, {expiresIn: '4h'});
}

export const generateTokens = (user: User) => {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
        accessToken: accessToken,
        refreshToken: refreshToken
    }
}

export const decodeRefreshToken = (token: string) => {
    const config = useRuntimeConfig();

    try {
        return jwt.verify(token, config.jwtRefreshSecret);
    } catch (error) {
        return null;
    }
}

export const decodeAccessToken = (token: string) => {
    const config = useRuntimeConfig();

    try {
        return jwt.verify(token, config.jwtAccessSecret);
    } catch (error) {
        return null;
    }
}

export const sendRefreshToken = (event: any, token: any) => {
    setCookie(event, "refreshToken", token, {
        httpOnly: true,
        sameSite: true
    })
}