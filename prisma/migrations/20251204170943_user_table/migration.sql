/*
  Warnings:

  - You are about to drop the column `location` on the `travelers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "travelers" DROP COLUMN "location",
ADD COLUMN     "address" TEXT;
