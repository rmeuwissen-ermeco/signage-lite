-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "screenHeight" INTEGER,
ADD COLUMN     "screenWidth" INTEGER;

-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN     "designHeight" INTEGER NOT NULL DEFAULT 1080,
ADD COLUMN     "designWidth" INTEGER NOT NULL DEFAULT 1920;
