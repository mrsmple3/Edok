/*
  Warnings:

  - You are about to drop the column `contragentId` on the `Lead` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Lead_contragentId_idx";

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "contragentId",
ADD COLUMN     "counterpartyId" INTEGER;

-- CreateIndex
CREATE INDEX "Lead_counterpartyId_idx" ON "Lead"("counterpartyId");
