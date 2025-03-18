/*
  Warnings:

  - You are about to drop the column `documentsId` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `documetnsQuantity` on the `Lead` table. All the data in the column will be lost.
  - Added the required column `counterpartyId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leadId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `documentsQuantity` to the `Lead` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Lead_documentsId_idx";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "counterpartyId" INTEGER NOT NULL,
ADD COLUMN     "leadId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "documentsId",
DROP COLUMN "documetnsQuantity",
ADD COLUMN     "documentsQuantity" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Counterparty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Counterparty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Counterparty_userId_idx" ON "Counterparty"("userId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "Document_leadId_idx" ON "Document"("leadId");

-- CreateIndex
CREATE INDEX "Document_counterpartyId_idx" ON "Document"("counterpartyId");
