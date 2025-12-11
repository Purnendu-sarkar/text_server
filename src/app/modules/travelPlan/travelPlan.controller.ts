import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { TravelPlanService } from "./travelPlan.service";
import { IJWTPayload } from "../../types/common";
import pick from "../../helper/pick";
import {  requestFilterableFields, travelPlanFilterableFields } from "./travelPlan.constant";

const createTravelPlan = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user as IJWTPayload;
    const result = await TravelPlanService.createTravelPlan(user, req.body);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Travel plan created successfully! 🎉",
        data: result,
    });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, travelPlanFilterableFields);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

    const result = await TravelPlanService.getAllFromDB(filters, options);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Travel plans retrieved successfully!✅",
        data: result,
    });
});

const getMyTravelPlans = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user as IJWTPayload;
    const filters = pick(req.query, travelPlanFilterableFields);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

    const result = await TravelPlanService.getMyTravelPlans(user, filters, options);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "My travel plans retrieved successfully!✅",
        data: result,
    });
});

const getSingleFromDB = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await TravelPlanService.getSingleFromDB(id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Travel plan retrieved successfully!",
        data: result,
    });
});

const updateTravelPlan = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user as IJWTPayload;
    const { id } = req.params;
    const result = await TravelPlanService.updateTravelPlan(user, id, req.body);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Travel plan updated successfully!",
        data: result,
    });
});

const softDeleteTravelPlan = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user as IJWTPayload;
    const { id } = req.params;
    const result = await TravelPlanService.softDeleteTravelPlan(user, id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Travel plan deleted successfully!",
        data: result,
    });
});

const getSingleForAdmin = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await TravelPlanService.getSingleForAdmin(id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Travel plan for admin retrieved successfully!",
        data: result,
    });
});

const hardDeleteTravelPlan = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await TravelPlanService.hardDeleteTravelPlan(id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Travel plan hard deleted successfully!",
        data: result,
    });
});

const getMatchedTravelPlans = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, [
        "destination",
        "travelType",
        "minBudget",
        "maxBudget",
        "startDate",
        "endDate",
        "interests"
    ]);

    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

    const result = await TravelPlanService.getMatchedTravelPlans(filters, options);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Matched travel plans retrieved successfully! ✨",
        data: result,
    });
});

const sendInterestRequest = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user as IJWTPayload;
    const { planId } = req.params;
    const result = await TravelPlanService.sendInterestRequest(user, planId, req.body);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Interest request sent successfully! 📩",
        data: result,
    });
});

const getRequestsForMyPlan = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user as IJWTPayload;
    const { planId } = req.params;
    const filters = pick(req.query, requestFilterableFields);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
    const result = await TravelPlanService.getRequestsForMyPlan(user, planId, filters, options);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Requests retrieved successfully! ✅",
        data: result,
    });
});

const updateRequestStatus = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user as IJWTPayload;
    const { requestId } = req.params;
    const result = await TravelPlanService.updateRequestStatus(user, requestId, req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: `Request ${result.status.toLowerCase()} successfully!`,
        data: result,
    });
});

const getMySentRequests = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user as IJWTPayload;
    const filters = pick(req.query, requestFilterableFields);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
    const result = await TravelPlanService.getMySentRequests(user, filters, options);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "My sent requests retrieved successfully! ✅",
        data: result,
    });
});

const startTravelPlan = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user as IJWTPayload;
    const { id } = req.params;
    const result = await TravelPlanService.startTravelPlan(user, id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Travel plan started successfully!",
        data: result,
    });
});

const completeTravelPlan = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user as IJWTPayload;
    const { id } = req.params;
    const result = await TravelPlanService.completeTravelPlan(user, id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Travel plan completed successfully!",
        data: result,
    });
});

export const TravelPlanController = {
    createTravelPlan,
    getAllFromDB,
    getMyTravelPlans,
    getSingleFromDB,
    updateTravelPlan,
    softDeleteTravelPlan,
    getSingleForAdmin,
    hardDeleteTravelPlan,
    getMatchedTravelPlans,
    sendInterestRequest,
    getRequestsForMyPlan,
    updateRequestStatus,
    getMySentRequests,
    startTravelPlan,
    completeTravelPlan
};