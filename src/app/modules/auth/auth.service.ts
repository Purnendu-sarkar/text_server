import httpStatus from 'http-status';
import bcrypt from "bcryptjs";
import { jwtHelper } from "../../helper/jwtHelper";
import { prisma } from "../../../lib/prisma";
import { UserStatus } from "../../../generated/prisma/enums";
import config from "../../config";
import ApiError from "../../errors/ApiError";
import emailSender from './emailSender';
import { Secret } from 'jsonwebtoken';

type LoginPayload = { email: string; password: string };

const login = async (payload: LoginPayload) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: { email: payload.email },
    });

    if (user.status !== UserStatus.ACTIVE) {
        throw new ApiError(httpStatus.FORBIDDEN, "User is not active");
    }

    const isCorrect = await bcrypt.compare(payload.password, user.password);
    if (!isCorrect) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Password is incorrect!");
    }

    const accessToken = jwtHelper.generateToken(
        { email: user.email, role: user.role },
        config.jwt_access_secret,
        config.jwt_access_expires
    );

    const refreshToken = jwtHelper.generateToken(
        { email: user.email, role: user.role },
        config.jwt_refresh_secret,
        config.jwt_refresh_expires
    );

    return { accessToken, refreshToken, needPasswordChange: user.needPasswordChange };
};

const getMe = async (session: any) => {
    const token = session.accessToken;
    if (!token) throw new ApiError(httpStatus.UNAUTHORIZED, "No access token");

    const decoded: any = jwtHelper.verifyToken(token, config.jwt_access_secret);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: decoded.email } });

    return {
        id: user.id,
        email: user.email,
        role: user.role,
        needPasswordChange: user.needPasswordChange,
        status: user.status,
    };
};

const refreshToken = async (token: string | undefined) => {
    if (!token) throw new ApiError(httpStatus.UNAUTHORIZED, "No refresh token");

    let decoded: any;
    try {
        decoded = jwtHelper.verifyToken(token, config.jwt_refresh_secret);
    } catch (err) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { email: decoded.email } });
    if (user.status !== UserStatus.ACTIVE) {
        throw new ApiError(httpStatus.FORBIDDEN, "User is not active");
    }

    const accessToken = jwtHelper.generateToken(
        { email: user.email, role: user.role },
        config.jwt_access_secret,
        config.jwt_access_expires
    );

    return { accessToken, needPasswordChange: user.needPasswordChange };
};

const changePassword = async (user: any, payload: { oldPassword: string; newPassword: string }) => {
    const userData = await prisma.user.findUniqueOrThrow({ where: { email: user.email } });

    const isCorrect = await bcrypt.compare(payload.oldPassword, userData.password);
    if (!isCorrect) throw new ApiError(httpStatus.BAD_REQUEST, "Old password incorrect");

    const hashed = await bcrypt.hash(payload.newPassword, Number(config.bcrypt_salt_rounds));
    await prisma.user.update({
        where: { email: userData.email },
        data: { password: hashed, needPasswordChange: false },
    });

    return { message: "Password changed successfully" };
};

const forgotPassword = async (payload: { email: string }) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: payload.email } });

    if (user.status !== UserStatus.ACTIVE) {
        throw new ApiError(httpStatus.FORBIDDEN, "User is not active");
    }

    const resetToken = jwtHelper.generateToken(
        { email: user.email, role: user.role },
        config.reset_pass_secret,
        config.reset_pass_expires
    );

    const resetLink = `${config.reset_pass_link}?token=${resetToken}&id=${user.id}`;

    const html = `
    <div>
      <p>Hi ${user.email},</p>
      <p>Click the button below to reset your password. The link expires in ${config.reset_pass_expires}.</p>
      <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:white;border-radius:6px;text-decoration:none;">Reset Password</a>
      <p>If you didn't request this, ignore this email.</p>
    </div>
  `;

    await emailSender(user.email, "Reset your TravelBuddy password", html);

    return { message: "Reset link sent to your email" };
};

const resetPassword = async (token: string | null, payload: { email?: string, password: string }, user?: { email: string }) => {
    let userEmail: string;

    // Case 1: Token-based reset (from forgot password email)
    if (token) {
        const decodedToken = jwtHelper.verifyToken(token, config.reset_pass_secret as Secret)

        if (!decodedToken) {
            throw new ApiError(httpStatus.FORBIDDEN, "Invalid or expired reset token!")
        }

        // Verify email from token matches the email in payload
        if (payload.email && decodedToken.email !== payload.email) {
            throw new ApiError(httpStatus.FORBIDDEN, "Email mismatch! Invalid reset request.")
        }

        userEmail = decodedToken.email;
    }
    // Case 2: Authenticated user with needPasswordChange (newly created admin/doctor)
    else if (user && user.email) {
        console.log({ user }, "needpassworchange");
        const authenticatedUser = await prisma.user.findUniqueOrThrow({
            where: {
                email: user.email,
                status: UserStatus.ACTIVE
            }
        });

        // Verify user actually needs password change
        if (!authenticatedUser.needPasswordChange) {
            throw new ApiError(httpStatus.BAD_REQUEST, "You don't need to reset your password. Use change password instead.")
        }

        userEmail = user.email;
    } else {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid request. Either provide a valid token or be authenticated.")
    }

    // hash password
    const password = await bcrypt.hash(payload.password, Number(config.bcrypt_salt_rounds));

    // update into database
    await prisma.user.update({
        where: {
            email: userEmail
        },
        data: {
            password,
            needPasswordChange: false
        }
    })
};


export const AuthService = {
    login,
    getMe,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
}