-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT,
ADD COLUMN     "patronymic" TEXT,
ADD COLUMN     "surname" TEXT;
