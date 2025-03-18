/*
  Warnings:

  - You are about to drop the column `contragent` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `documentsQuantity` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `moderators` on the `Lead` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "contragent",
DROP COLUMN "documentsQuantity",
DROP COLUMN "moderators",
ADD COLUMN     "contragentId" INTEGER,
ADD COLUMN     "moderatorsId" INTEGER;

-- CreateIndex
CREATE INDEX "Lead_moderatorsId_idx" ON "Lead"("moderatorsId");

-- CreateIndex
CREATE INDEX "Lead_contragentId_idx" ON "Lead"("contragentId");
