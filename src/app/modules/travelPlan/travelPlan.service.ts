import { prisma } from "../../../lib/prisma";
import { PlanStatus, Prisma, RequestStatus, TravelPlan, UserRole } from "../../../generated/prisma/client";
import { IJWTPayload } from "../../types/common";
import { CreateTravelPlanInput, SendRequestInput, UpdateRequestStatusInput, UpdateTravelPlanInput } from "./travelPlan.interface";

import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { paginationHelper } from "../../helper/paginationHelper";
import { travelPlanSearchableFields } from "./travelPlan.constant";
import { ReviewService } from "../review/review.service";

const createTravelPlan = async (user: IJWTPayload, payload: CreateTravelPlanInput): Promise<TravelPlan> => {
    if (user.role !== UserRole.TRAVELER) {
        throw new ApiError(httpStatus.FORBIDDEN, "Only travelers can create plans");
    }

    const traveler = await prisma.traveler.findUniqueOrThrow({ where: { email: user.email } });

    return prisma.travelPlan.create({
        data: {
            ...payload,
            travelerId: traveler.id,
        },
    });
};

const getAllFromDB = async (params: any, options: any) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.TravelPlanWhereInput[] = [];

    if (searchTerm) {
        andConditions.push({
            OR: travelPlanSearchableFields.map(field => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            })),
        });
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: filterData[key],
                },
            })),
        });
    }

    andConditions.push({ isDeleted: false });

    const whereConditions: Prisma.TravelPlanWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await prisma.travelPlan.findMany({
        skip,
        take: limit,
        where: whereConditions,
        orderBy: { [sortBy]: sortOrder },
        include: {
            traveler: {
                select: {
                    name: true,
                    email: true,
                    _count: { select: { travelPlans: true } }
                }
            }
        }
    });

    const formatted = await Promise.all(
        result.map(async (plan) => {
            const { avgRating, totalReviews } = await ReviewService.getTravelerReviewSummary(plan.travelerId);
            return {
                ...plan,
                travelerPlanCount: plan.traveler?._count?.travelPlans || 0,
                hostRating: { avgRating, totalReviews },
            };
        })
    );

    const total = await prisma.travelPlan.count({ where: whereConditions });
    const totalPages = Math.ceil(total / limit);

    return {
        meta: { page, limit, total, totalPages },
        data: formatted,
    };
};

const getMyTravelPlans = async (user: IJWTPayload, params: any, options: any) => {
    const traveler = await prisma.traveler.findUniqueOrThrow({ where: { email: user.email } });

    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.TravelPlanWhereInput[] = [{ travelerId: traveler.id }];
    if (searchTerm) {
        andConditions.push({
            OR: travelPlanSearchableFields.map(field => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            })),
        });
    }
    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: filterData[key],
                },
            })),
        });
    }

    andConditions.push({ isDeleted: false });

    const whereConditions: Prisma.TravelPlanWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await prisma.travelPlan.findMany({
        skip,
        take: limit,
        where: whereConditions,
        orderBy: { [sortBy]: sortOrder },
        include: {
            _count: {
                select: { buddyRequests: true }
            }
        }
    });
    const formatted = await Promise.all(
  result.map(async (plan) => {
    const { avgRating, totalReviews } = await ReviewService.getTravelerReviewSummary(plan.travelerId);
    return {
      ...plan,
      buddyRequestsCount: plan._count.buddyRequests,
      hostRating: { avgRating, totalReviews },
    };
  })
);
    const total = await prisma.travelPlan.count({ where: whereConditions });
    const totalPages = Math.ceil(total / limit);

    return {
        meta: { page, limit, total, totalPages },
        data: formatted,
    };
};

const getSingleFromDB = async (id: string): Promise<any> => {
    const plan = await prisma.travelPlan.findUnique({
        where: { id, isDeleted: false },
        include: {
            traveler: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    bio: true,
                    gender: true,
                    profilePhoto: true,
                    interests: true,
                    visitedCountries: true,
                    isVerified: true,
                },
            },
        },
    });

    if (!plan) throw new ApiError(httpStatus.NOT_FOUND, "Plan not found");

    const { avgRating, totalReviews } = await ReviewService.getTravelerReviewSummary(plan.travelerId);
    const reviews = await ReviewService.getReviewsForTravelPlan(id);

    return {
        ...plan,
        hostRating: { avgRating, totalReviews },
        reviews,
    };
};

const updateTravelPlan = async (user: IJWTPayload, id: string, payload: UpdateTravelPlanInput): Promise<TravelPlan> => {
    const plan = await prisma.travelPlan.findUniqueOrThrow({
        where: { id, isDeleted: false },
    });

    const traveler = await prisma.traveler.findUniqueOrThrow({ where: { email: user.email } });

    if (plan.travelerId !== traveler.id) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only update your own plans");
    }

    return prisma.travelPlan.update({
        where: { id },
        data: payload,
    });
};

const softDeleteTravelPlan = async (user: IJWTPayload, id: string): Promise<TravelPlan> => {
    const plan = await prisma.travelPlan.findUniqueOrThrow({
        where: { id, isDeleted: false },
    });

    const traveler = await prisma.traveler.findUniqueOrThrow({ where: { email: user.email } });

    if (plan.travelerId !== traveler.id) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only delete your own plans");
    }

    return prisma.travelPlan.update({
        where: { id },
        data: { isDeleted: true },
    });
};

const getSingleForAdmin = async (id: string): Promise<any> => {
    const plan = await prisma.travelPlan.findUnique({
        where: { id, isDeleted: false },
        include: {
            traveler: true
            //     traveler: {
            //         select: { name: true, email: true }
            //     }
            // }
        }
    });

    if (!plan) {
        throw new ApiError(httpStatus.NOT_FOUND, "Travel plan not found");
    }

    const planCount = await prisma.travelPlan.count({
        where: { travelerId: plan.travelerId, isDeleted: false }
    });

    return {
        ...plan,
        travelerPlanCount: planCount
    };
};

const hardDeleteTravelPlan = async (id: string): Promise<TravelPlan> => {
    const plan = await prisma.travelPlan.findUniqueOrThrow({
        where: { id }
    });

    return prisma.travelPlan.delete({
        where: { id }
    });
};


const getMatchedTravelPlans = async (filters: any, options: any) => {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options;
    const skip = (page - 1) * limit;

    const andConditions: Prisma.TravelPlanWhereInput[] = [
        { isDeleted: false }
    ];
    //1. destination match
    if (filters.destination) {
        andConditions.push({
            destination: {
                contains: filters.destination,
                mode: "insensitive"
            }
        });
    }

    // 2. Travel Type match
    if (filters.travelType) {
        andConditions.push({
            travelType: filters.travelType
        });
    }

    // 3. Budget Range
    if (filters.minBudget || filters.maxBudget) {
        andConditions.push({
            budget: {
                gte: filters.minBudget ? Number(filters.minBudget) : undefined,
                lte: filters.maxBudget ? Number(filters.maxBudget) : undefined,
            }
        });
    }

    // 4. Date Range overlap check (very important!)
    if (filters.startDate || filters.endDate) {
        const searchStart = filters.startDate ? new Date(filters.startDate) : null;
        const searchEnd = filters.endDate ? new Date(filters.endDate) : null;

        const dateConditions: Prisma.TravelPlanWhereInput[] = [];

        if (searchStart && searchEnd) {
            // If both dates are present → check overlap
            dateConditions.push({
                OR: [
                    {
                        AND: [
                            { startDate: { lte: searchEnd } },
                            { endDate: { gte: searchStart } }
                        ]
                    }
                ]
            });
        } else if (searchStart) {
            dateConditions.push({ endDate: { gte: searchStart } });
        } else if (searchEnd) {
            dateConditions.push({ startDate: { lte: searchEnd } });
        }

        if (dateConditions.length > 0) {
            andConditions.push({ AND: dateConditions });
        }
    }

    // 5. Interests match (the smartest part!)
    if (filters.interests && Array.isArray(filters.interests) && filters.interests.length > 0) {
        andConditions.push({
            traveler: {
                interests: {
                    hasSome: filters.interests // Prisma's hasSome → matches if any one element in the array matches
                }
            }
        });
    }

    const whereConditions: Prisma.TravelPlanWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await prisma.travelPlan.findMany({
        where: whereConditions,
        skip,
        take: Number(limit),
        orderBy: {
            [sortBy]: sortOrder
        },
        include: {
            traveler: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    bio: true,
                    gender: true,
                    profilePhoto: true,
                    interests: true,
                    visitedCountries: true,
                    isVerified: true,
                    _count: {
                        select: { travelPlans: true }
                    }
                }
            }
        }
    });

    // Adding match score (so that frontend can show "90% Match")

    const formatted = await Promise.all(result.map(async (plan) => {
        let matchScore = 0;
        const totalCriteria = 5; // destination, type, budget, date, interests
        const { avgRating, totalReviews } = await ReviewService.getTravelerReviewSummary(plan.travelerId);

        if (filters.destination && plan.destination.toLowerCase().includes(filters.destination.toLowerCase())) matchScore += 20;
        if (filters.travelType && plan.travelType === filters.travelType) matchScore += 20;
        if (filters.minBudget && filters.maxBudget && plan.budget >= filters.minBudget && plan.budget <= filters.maxBudget) matchScore += 20;
        // Date overlap (simplified)
        if (filters.startDate && filters.endDate) {
            const s1 = new Date(plan.startDate);
            const e1 = new Date(plan.endDate);
            const s2 = new Date(filters.startDate);
            const e2 = new Date(filters.endDate);
            if (s1 <= e2 && e1 >= s2) matchScore += 20;
        }
        if (filters.interests && plan.traveler.interests.some((i: string) => filters.interests.includes(i))) {
            matchScore += 20;
        }

        return {
            ...plan,
            hostRating: { avgRating, totalReviews },
            matchScore: Math.min(matchScore, 100) + "% Match 🔥"
        };
    }));

    const total = await prisma.travelPlan.count({ where: whereConditions });

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / limit)
        },
        data: formatted
    };
};

const sendInterestRequest = async (user: IJWTPayload, planId: string, payload: SendRequestInput) => {
    if (user.role !== UserRole.TRAVELER) {
        throw new ApiError(httpStatus.FORBIDDEN, "Only travelers can send requests");
    }
    const traveler = await prisma.traveler.findUniqueOrThrow({ where: { email: user.email } });
    const plan = await prisma.travelPlan.findUniqueOrThrow({
        where: { id: planId, isDeleted: false },
    });
    if (plan.travelerId === traveler.id) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Cannot request your own plan");
    }
    const existingRequest = await prisma.travelBuddyRequest.findFirst({
        where: {
            travelPlanId: planId,
            requesterId: traveler.id,
        },
    });
    if (existingRequest) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Request already sent");
    }
    return prisma.travelBuddyRequest.create({
        data: {
            travelPlanId: planId,
            requesterId: traveler.id,
            message: payload.message,
        },
        include: {
            requester: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                },
            },
        },
    });
};

const getRequestsForMyPlan = async (user: IJWTPayload, planId: string, filters: any, options: any) => {
    const traveler = await prisma.traveler.findUniqueOrThrow({ where: { email: user.email } });
    const plan = await prisma.travelPlan.findUniqueOrThrow({
        where: { id: planId, travelerId: traveler.id, isDeleted: false },
    });
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options;
    const skip = (page - 1) * limit;
    const andConditions: Prisma.TravelBuddyRequestWhereInput[] = [
        { travelPlanId: planId },
    ];
    if (filters.status) {
        andConditions.push({ status: filters.status });
    }
    const whereConditions: Prisma.TravelBuddyRequestWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};
    const result = await prisma.travelBuddyRequest.findMany({
        where: whereConditions,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
            requester: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    bio: true,
                    gender: true,
                    profilePhoto: true,
                    interests: true,
                    visitedCountries: true,
                    isVerified: true,
                },
            },
        },
    });
    const total = await prisma.travelBuddyRequest.count({ where: whereConditions });
    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: result,
    };
};

const updateRequestStatus = async (user: IJWTPayload, requestId: string, payload: UpdateRequestStatusInput) => {
    const request = await prisma.travelBuddyRequest.findUniqueOrThrow({
        where: { id: requestId },
        include: { travelPlan: true },
    });
    const traveler = await prisma.traveler.findUniqueOrThrow({ where: { email: user.email } });
    if (request.travelPlan.travelerId !== traveler.id) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only update requests for your own plans");
    }
    if (request.status !== RequestStatus.PENDING) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Only pending requests can be updated");
    }
    return prisma.travelBuddyRequest.update({
        where: { id: requestId },
        data: { status: payload.status },
        include: {
            requester: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                },
            },
        },
    });
};

const getMySentRequests = async (user: IJWTPayload, filters: any, options: any) => {
    const traveler = await prisma.traveler.findUniqueOrThrow({ where: { email: user.email } });
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options;
    const skip = (page - 1) * limit;
    const andConditions: Prisma.TravelBuddyRequestWhereInput[] = [
        { requesterId: traveler.id },
    ];
    if (filters.status) {
        andConditions.push({ status: filters.status });
    }
    const whereConditions: Prisma.TravelBuddyRequestWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};
    const result = await prisma.travelBuddyRequest.findMany({
        where: whereConditions,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
            travelPlan: {
                include: {
                    traveler: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            bio: true,
                            gender: true,
                            profilePhoto: true,
                            interests: true,
                            visitedCountries: true,
                            isVerified: true,
                        },
                    },
                },
            },
        },

    });
    const total = await prisma.travelBuddyRequest.count({ where: whereConditions });
    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: result,
    };
};

const startTravelPlan = async (user: IJWTPayload, id: string): Promise<TravelPlan> => {
    const plan = await prisma.travelPlan.findUniqueOrThrow({
        where: { id, isDeleted: false },
    });
    const traveler = await prisma.traveler.findUniqueOrThrow({ where: { email: user.email } });
    if (plan.travelerId !== traveler.id) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only start your own plans");
    }
    if (plan.status !== PlanStatus.PENDING) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Plan is not pending");
    }
    const currentDate = new Date();
    if (plan.startDate > currentDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Cannot start plan before start date");
    }
    return prisma.travelPlan.update({
        where: { id },
        data: { status: PlanStatus.ONGOING },
    });
};

const completeTravelPlan = async (user: IJWTPayload, id: string): Promise<TravelPlan> => {
    const plan = await prisma.travelPlan.findUniqueOrThrow({
        where: { id, isDeleted: false },
    });
    const traveler = await prisma.traveler.findUniqueOrThrow({ where: { email: user.email } });
    if (plan.travelerId !== traveler.id) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only complete your own plans");
    }
    if (plan.status !== PlanStatus.ONGOING) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Plan is not ongoing");
    }
    const currentDate = new Date();
    if (plan.endDate > currentDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Cannot complete plan before end date");
    }
    return prisma.travelPlan.update({
        where: { id },
        data: { status: PlanStatus.COMPLETED },
    });
};

// Cron job logic (This can be called in app.ts or server.ts on startup)
const setupCronJobs = () => {
    const cron = require('node-cron');
    // Run every minute (adjust as needed, e.g., '0 0 * * *' for daily at midnight)
    cron.schedule('0 12,0 * * *', async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);


        console.log("Cron Called")

        // Auto-start pending plans where startDate <= currentDate
        await prisma.travelPlan.updateMany({
            where: {
                status: PlanStatus.PENDING,
                startDate: { lte: today },
                isDeleted: false,
            },
            data: { status: PlanStatus.ONGOING },
        });

        // Auto-complete ongoing plans where endDate < currentDate
        await prisma.travelPlan.updateMany({
            where: {
                status: PlanStatus.ONGOING,
                endDate: { lt: today },
                isDeleted: false,
            },
            data: { status: PlanStatus.COMPLETED },
        });
    });
};

export const TravelPlanService = {
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
    completeTravelPlan,
    setupCronJobs,
};