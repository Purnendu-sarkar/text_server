import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthService } from "./auth.service";
import config from "../../config";

const cookieOptions = {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: config.node_env === "production" ? "none" as const : "lax" as const,
};


const login = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);
    const { accessToken, refreshToken, needPasswordChange } = result;

    res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60, // 1 hour
    });
    res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60 * 24 * 90, // 90 days
    });

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User logged in successfully!",
        data: { needPasswordChange },
    });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
    const session = req.cookies;
    const result = await AuthService.getMe(session);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User retrieved successfully 🤷‍♂️",
        data: result,
    });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;
    const result = await AuthService.refreshToken(token);
    res.cookie("accessToken", result.accessToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60,
    });
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Access token generated successfully ",
        data: null,
    });
});

const changePassword = catchAsync(async (req: Request & { user?: any }, res: Response) => {
    const user = req.user;
    const result = await AuthService.changePassword(user, req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Password changed successfully",
        data: result,
    });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.forgotPassword(req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "If an account exists, you will receive a reset link",
        data: result,
    });
});

const resetPassword = catchAsync(async (req: Request & { user?: any }, res: Response) => {
    const token = req.body.token || null;
    const user = req.user; 

    await AuthService.resetPassword(token, req.body, user);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Password Reset!",
        data: null,
    });
});

export const AuthController = {
    login,
    getMe,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
}