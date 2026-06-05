-- CreateEnum
CREATE TYPE "FoodSource" AS ENUM ('ciqual', 'ai', 'manual');

-- AlterTable
ALTER TABLE "FoodReference" ADD COLUMN     "source" "FoodSource" NOT NULL DEFAULT 'ciqual';
