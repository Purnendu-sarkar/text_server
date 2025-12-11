import express from "express";
import { TravelPlanController } from "./travelPlan.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../../../generated/prisma/enums";
import { TravelPlanValidation } from "./travelPlan.validation";

const router = express.Router();

router.get("/", TravelPlanController.getAllFromDB);
router.get("/match", TravelPlanController.getMatchedTravelPlans);

router.get(
    "/my-plans",
    auth(UserRole.TRAVELER),
    TravelPlanController.getMyTravelPlans
);

router.get(
    "/my-requests",
    auth(UserRole.TRAVELER),
    TravelPlanController.getMySentRequests
)

router.get("/:id", TravelPlanController.getSingleFromDB);

router.get(
    "/admin/:id",
    auth(UserRole.ADMIN),
    TravelPlanController.getSingleForAdmin
);

router.post(
    "/",
    auth(UserRole.TRAVELER),
    (req, res, next) => {
        req.body = TravelPlanValidation.createTravelPlanValidationSchema.parse(req.body);
        next();
    },
    TravelPlanController.createTravelPlan
);

router.patch(
    "/:id",
    auth(UserRole.TRAVELER),
    (req, res, next) => {
        req.body = TravelPlanValidation.updateTravelPlanValidationSchema.parse(req.body);
        next();
    },
    TravelPlanController.updateTravelPlan
);

router.delete(
    "/:id",
    auth(UserRole.TRAVELER),
    TravelPlanController.softDeleteTravelPlan
);

router.delete(
    "/admin/:id",
    auth(UserRole.ADMIN),
    TravelPlanController.hardDeleteTravelPlan
);


router.post(
    "/:planId/request",
    auth(UserRole.TRAVELER),
    (req, res, next) => {
        req.body = TravelPlanValidation.sendRequestValidationSchema.parse(req.body);
        next();
    },
    TravelPlanController.sendInterestRequest
);

router.get(
    "/my-plans/:planId/requests",
    auth(UserRole.TRAVELER),
    TravelPlanController.getRequestsForMyPlan
);

router.patch(
    "/requests/:requestId",
    auth(UserRole.TRAVELER),
    (req, res, next) => {
        req.body = TravelPlanValidation.updateRequestStatusValidationSchema.parse(req.body);
        next();
    },
    TravelPlanController.updateRequestStatus
);

router.patch(
    "/:id/start",
    auth(UserRole.TRAVELER),
    TravelPlanController.startTravelPlan
);
router.patch(
    "/:id/complete",
    auth(UserRole.TRAVELER),
    TravelPlanController.completeTravelPlan
);

export const travelPlanRoutes = router;