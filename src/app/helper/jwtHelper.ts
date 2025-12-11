import jwt, { Secret, SignOptions } from "jsonwebtoken";

interface JwtPayload {
    email: string;
    role: string;
}


const generateToken = (
    payload: JwtPayload,
    secret: Secret,
    expiresIn: string
): string => {
    try {
        const token = jwt.sign(payload, secret, {
            algorithm: "HS256",
            expiresIn,
        } as SignOptions);

        return token;
    } catch (error) {
        console.error("JWT generation failed:", error);
        throw new Error("Failed to generate token");
    }
};


const verifyToken = (token: string, secret: Secret) => {
    return jwt.verify(token, secret) as JwtPayload
}

export const jwtHelper = {
    generateToken,
    verifyToken
}