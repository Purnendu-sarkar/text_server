import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ReviewService } from "./review.service";
import { Request, Response } from "express";
import { IJWTPayload } from "../../types/common";

const createReview = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user as IJWTPayload;
    const result = await ReviewService.createReview(user, req.body);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Review submitted successfully.!",
        data: result,
    });
});

const getMyReviews = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user as IJWTPayload;
    const result = await ReviewService.getMyReceivedReviews(user);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Your reviews retrieved successfully.!",
        data: result,
    });
});

export const ReviewController = {
    createReview,
    getMyReviews,
}; 