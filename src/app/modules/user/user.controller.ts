import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { UserService } from "./user.service";
import pick from "../../helper/pick";
import { userFilterableFields } from "./user.constant";
import { IJWTPayload } from "../../types/common";

const createTraveler = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.createTraveler(req);
    console.log(result)

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Traveler created successfully! 🎉",
        data: result
    })
})

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, userFilterableFields);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

    const result = await UserService.getAllFromDB(filters, options);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Users retrieved successfully!✅",
        data: result
    });
});

const getMyProfile = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await UserService.getMyProfile(user as IJWTPayload);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "My profile fetched successfully!",
        data: result
    });
});

const getSingleTraveler = catchAsync(async (req, res) => {
    const { email } = req.params;
    const result = await UserService.getSingleTraveler(email);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Traveler retrieved successfully",
        data: result
    });
});

const updateMyProfile = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const payload = req.body;

    const result = await UserService.updateMyProfile(user as IJWTPayload, payload);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Profile updated successfully!",
        data: result
    });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.params;

    const result = await UserService.updateUserStatus(email, req.body.status);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User status updated!",
        data: result
    });
});


const deleteTravelerByEmail = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.params;

    const result = await UserService.deleteTravelerByEmail(email);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Traveler deleted successfully!",
        data: result,
    });
});

export const UserController = {
    createTraveler,
    getAllFromDB,
    getMyProfile,
    getSingleTraveler,
    updateMyProfile,
    updateUserStatus,
    deleteTravelerByEmail,
}