-- CreateEnum
CREATE TYPE "TravelType" AS ENUM ('ADVENTURE', 'LEISURE', 'BUSINESS', 'FAMILY', 'SOLO');

-- CreateTable
CREATE TABLE "travel_plans" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "travelType" "TravelType" NOT NULL,
    "itinerary" TEXT,
    "description" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travel_plans_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "travel_plans" ADD CONSTRAINT "travel_plans_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
