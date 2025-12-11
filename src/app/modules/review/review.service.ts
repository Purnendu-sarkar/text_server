import { prisma } from "../../../lib/prisma";
import { PlanStatus, RequestStatus } from "../../../generated/prisma/client";
import { IJWTPayload } from "../../types/common";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const createReview = async (user: IJWTPayload, payload: { travelPlanId: string; revieweeId: string; rating: number; comment?: string }) => {
  const traveler = await prisma.traveler.findUniqueOrThrow({
    where: { email: user.email },
  });

  const plan = await prisma.travelPlan.findUniqueOrThrow({
    where: { id: payload.travelPlanId },
    include: { buddyRequests: true },
  });

  // Only COMPLETED trips can be reviewed.
  if (plan.status !== PlanStatus.COMPLETED) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Trip is not completed. Review cannot be submitted.");
  }

  // Check if you were part of this trip
  const isHost = plan.travelerId === traveler.id;
  const isBuddy = plan.buddyRequests.some(
    (req) => req.requesterId === traveler.id && req.status === RequestStatus.ACCEPTED
  );

  if (!isHost && !isBuddy) {
    throw new ApiError(httpStatus.FORBIDDEN, "You were not part of this trip!");
  }

  // Check if the reviewee was part of this trip
  const isRevieweeInTrip = plan.travelerId === payload.revieweeId ||
    plan.buddyRequests.some(
      (req) => req.requesterId === payload.revieweeId && req.status === RequestStatus.ACCEPTED
    );

  if (!isRevieweeInTrip) {
    throw new ApiError(httpStatus.BAD_REQUEST, "This person was not on this trip.");
  }

  if (traveler.id === payload.revieweeId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot review yourself.");
  }

  // Only one review per person per trip
  const existing = await prisma.review.findUnique({
    where: {
      reviewerId_revieweeId_travelPlanId: {
        reviewerId: traveler.id,
        revieweeId: payload.revieweeId,
        travelPlanId: payload.travelPlanId,
      },
    },
  });

  if (existing) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You have already reviewed this person.");
  }

  return await prisma.review.create({
    data: {
      reviewerId: traveler.id,
      revieweeId: payload.revieweeId,
      travelPlanId: payload.travelPlanId,
      rating: payload.rating,
      comment: payload.comment,
    },
    include: {
      reviewer: { select: { name: true, profilePhoto: true } },
      reviewee: { select: { name: true, profilePhoto: true } },
      travelPlan: { select: { destination: true } },
    },
  });
};

const getMyReceivedReviews = async (user: IJWTPayload) => {
  const traveler = await prisma.traveler.findUniqueOrThrow({
    where: { email: user.email },
  });

  const reviews = await prisma.review.findMany({
    where: { revieweeId: traveler.id },
    include: {
      reviewer: { select: { name: true, profilePhoto: true } },
      travelPlan: { select: { destination: true, startDate: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const avgRating = reviews.length > 0
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : 0;

  return {
    avgRating,
    totalReviews: reviews.length,
    reviews,
  };
};

const getTravelerReviewSummary = async (travelerId: string) => {
  const reviews = await prisma.review.findMany({
    where: { revieweeId: travelerId },
  });

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

  return { avgRating, totalReviews };
};

const getReviewsForTravelPlan = async (travelPlanId: string) => {
  return await prisma.review.findMany({
    where: { travelPlanId },
    include: {
      reviewer: { select: { name: true, profilePhoto: true } },
      reviewee: { select: { name: true, profilePhoto: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const ReviewService = {
  createReview,
  getMyReceivedReviews,
    getTravelerReviewSummary,
    getReviewsForTravelPlan,
};