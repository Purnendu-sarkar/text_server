import express, { NextFunction, Request, Response } from "express"
import { UserController } from "./user.controller";
import { fileUploader } from "../../helper/fileUploader";
import { UserValidation } from "./user.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "../../../generated/prisma/enums";

const router = express.Router();


router.get(
    "/",
    auth(UserRole.ADMIN),
    UserController.getAllFromDB
)

router.get(
    "/me",
    auth(UserRole.TRAVELER, UserRole.ADMIN),
    UserController.getMyProfile
);

router.get(
    "/:email",
    auth(UserRole.ADMIN),
    UserController.getSingleTraveler
);

router.patch(
    "/me",
    auth(UserRole.TRAVELER),
    UserController.updateMyProfile
);

router.patch(
    "/:email/status",
    auth(UserRole.ADMIN),
    UserController.updateUserStatus
);

router.post(
    "/create-traveler",
    fileUploader.upload.single("file"),
    // UserController.createTraveler
    (req: Request, res: Response, next: NextFunction) => {
        req.body = UserValidation.createTravelerValidationSchema.parse(JSON.parse(req.body.data))
        return UserController.createTraveler(req, res, next)
    }
)

router.delete(
    "/:email",
    auth(UserRole.ADMIN),
    UserController.deleteTravelerByEmail
);

export const userRoutes = router;