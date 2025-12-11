import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { fileUploader } from "../../helper/fileUploader";
import { Request } from "express";
import config from "../../config";
import { paginationHelper } from "../../helper/paginationHelper";
import { Prisma, UserRole, UserStatus } from "../../../generated/prisma/client";
import { userSearchableFields } from "./user.constant";
import { IJWTPayload } from "../../types/common";
import { UpdateTravelerProfileInput } from "./user.interface";
import { ReviewService } from "../review/review.service";


const createTraveler = async (req: Request) => {
    // 1. Handle profile image upload
    if (req.file) {
        const uploadResult = await fileUploader.uploadToCloudinary(req.file);
        req.body.traveler.profilePhoto = uploadResult?.secure_url
        // console.log("Photo", uploadResult)
    }

    const { password, traveler } = req.body;
    const hashedPassword = await bcrypt.hash(password, config.bcrypt_salt_rounds);

    // 2. Prisma Transaction
    const result = await prisma.$transaction(async (tnx) => {
        // Create user
        await tnx.user.create({
            data: {
                email: traveler.email,
                password: hashedPassword,
                role: "TRAVELER",
                status: "ACTIVE",
            },
        });
        // Create traveler profile
        return await tnx.traveler.create({
            data: traveler,
        });
    });

    return result;
}

const getAllFromDB = async (params: any, options: any) => {
    const { page, limit, skip, sortBy, sortOrder } =
        paginationHelper.calculatePagination(options);

    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.UserWhereInput[] = [];

    if (searchTerm) {
        andConditions.push({
            OR: [
                // Search inside User table
                ...userSearchableFields.map(field => ({
                    [field]: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                })),

                // Search inside Traveler table
                {
                    travelers: {
                        name: {
                            contains: searchTerm,
                            mode: "insensitive",
                        },
                    },
                },
            ],
        });
    }

    if (Object.keys(filterData).length > 0) {
        Object.keys(filterData).forEach((key) => {

            // Traveler-specific filters
            if (["name", "gender", "address"].includes(key)) {
                andConditions.push({
                    travelers: {
                        [key]: {
                            contains: filterData[key],
                            mode: "insensitive",
                        },
                    },
                });
            }

            // User-specific filters
            else {
                andConditions.push({
                    [key]: {
                        equals: filterData[key],
                    },
                });
            }
        });
    }

    andConditions.push({
        role: "TRAVELER",
        isDeleted: false,
    });

    const whereConditions: Prisma.UserWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    // ✅ 1. First get users with traveler relation
    const result = await prisma.user.findMany({
        skip,
        take: limit,
        where: whereConditions,
        orderBy: {
            [sortBy]: sortOrder,
        },
        select: {
            id: true,
            email: true,
            role: true,
            needPasswordChange: true,
            status: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,

            travelers: true,
        }
    });



    // ✅ 2. FLATTEN the response
    const formattedData = result.map(user => {
        const { travelers, ...userData } = user;

        return {
            ...userData,
            ...travelers,
        };
    });

    const total = await prisma.user.count({ where: whereConditions });
    const totalPages = Math.ceil(total / limit);

    return {
        meta: { page, limit, total, totalPages },
        data: formattedData
    };
};

const getMyProfile = async (user: IJWTPayload) => {
    const userInfo = await prisma.user.findUniqueOrThrow({
        where: { email: user.email, status: UserStatus.ACTIVE },
        omit: {
            password: true,
            needPasswordChange: true,
            createdAt: true,
            updatedAt: true
        }
    });
    let profileData: any = {};
  let reviewSummary = { avgRating: 0, totalReviews: 0 };

    if (userInfo.role === UserRole.TRAVELER) {
        profileData = await prisma.traveler.findUnique({
            where: {
                email: userInfo.email
            },
            include: {
                _count: {
                    select: { travelPlans: true },
                },
            },
            omit: {
                createdAt: true,
                updatedAt: true
            }
        })
        reviewSummary = await ReviewService.getTravelerReviewSummary(profileData!.id);
    } else if (userInfo.role === UserRole.ADMIN) {
        profileData = await prisma.admin.findUnique({
            where: {
                email: userInfo.email
            }
        })
    }

    return {
        ...userInfo,
        ...profileData,
        reviewSummary
    };
};

const getSingleTraveler = async (email: string) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: { email, role: UserRole.TRAVELER },
        select: {
            id: true,
            email: true,
            status: true,
            role: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
            travelers: {
                include: {
                    _count: {
                        select: { travelPlans: true },
                    },
                },
            },
        }
    });
    const travelerId = user.travelers?.id;
    const reviewSummary = travelerId
        ? await ReviewService.getTravelerReviewSummary(travelerId)
        : { avgRating: 0, totalReviews: 0 };

    return {
        ...user,
        ...user.travelers,
        travelPlansCount: user.travelers?._count.travelPlans,
        reviewSummary
    };
};

const updateMyProfile = async (
    user: IJWTPayload,
    payload: UpdateTravelerProfileInput
) => {
    return prisma.traveler.update({
        where: { email: user.email },
        data: payload
    });
};

const updateUserStatus = async (email: string, status: UserStatus) => {
    return prisma.user.update({
        where: { email },
        data: { status },
        select: {
            id: true,
            email: true,
            status: true,
            role: true,
            updatedAt: true,
            travelers: true,
        }
    });
};

const deleteTravelerByEmail = async (email: string) => {
    const user = await prisma.user.update({
        where: { email },
        data: {
            isDeleted: true,
            status: "INACTIVE",
        },
        select: {
            id: true,
            email: true,
            role: true,
            isDeleted: true,
            status: true,
            updatedAt: true,
        },
    });

    await prisma.traveler.update({
        where: { email },
        data: {
            isDeleted: true,
        },
    });

    return user;
};

export const UserService = {
    createTraveler,
    getAllFromDB,
    getMyProfile,
    getSingleTraveler,
    updateMyProfile,
    updateUserStatus,
    deleteTravelerByEmail
}