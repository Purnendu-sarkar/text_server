-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('PENDING', 'ONGOING', 'COMPLETED');

-- AlterTable
ALTER TABLE "travel_plans" ADD COLUMN     "status" "PlanStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "travel_buddy_requests" (
    "id" TEXT NOT NULL,
    "travelPlanId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "message" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travel_buddy_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "travel_buddy_requests" ADD CONSTRAINT "travel_buddy_requests_travelPlanId_fkey" FOREIGN KEY ("travelPlanId") REFERENCES "travel_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_buddy_requests" ADD CONSTRAINT "travel_buddy_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "travelers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
