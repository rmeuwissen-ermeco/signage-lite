-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "lastPlaylistVersion" INTEGER,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3);
