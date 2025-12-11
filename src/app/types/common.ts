import { UserRole } from "../../generated/prisma/enums";

export type IJWTPayload = {
    email: string;
    role: UserRole;
}