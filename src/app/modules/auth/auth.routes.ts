import express, { NextFunction, Request, Response } from 'express'
import { AuthController } from './auth.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '../../../generated/prisma/enums';


const router = express.Router();

router.get(
    "/me",
    AuthController.getMe
);

router.post(
    "/login",
    AuthController.login
)

router.post("/refresh-token", AuthController.refreshToken);
router.post("/change-password", auth(UserRole.TRAVELER, UserRole.ADMIN), AuthController.changePassword);
router.post("/forgot-password", AuthController.forgotPassword);

router.post(
    '/reset-password',
    (req: Request, res: Response, next: NextFunction) => {
        // Make auth middleware optional: if no authorization header, skip auth
        if (!req.headers.authorization) {
            next();
        } else {
            auth(UserRole.ADMIN, UserRole.TRAVELER)(req, res, next);
        }
    },
    AuthController.resetPassword
)

export const authRoutes = router;