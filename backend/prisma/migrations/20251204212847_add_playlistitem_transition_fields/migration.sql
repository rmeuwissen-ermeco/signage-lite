-- CreateEnum
CREATE TYPE "TransitionType" AS ENUM ('NONE', 'FADE');

-- AlterTable
ALTER TABLE "PlaylistItem" ADD COLUMN     "transitionDurationMs" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "transitionType" "TransitionType" NOT NULL DEFAULT 'FADE',
ALTER COLUMN "durationSec" SET DEFAULT 10;
