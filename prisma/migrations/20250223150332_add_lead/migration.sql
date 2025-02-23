/*
  Warnings:

  - You are about to drop the column `content` on the `Document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "content";

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "docemetns" INTEGER NOT NULL,
    "moderators" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contragent" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "documentsId" INTEGER NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_authorId_idx" ON "Lead"("authorId");

-- CreateIndex
CREATE INDEX "Lead_documentsId_idx" ON "Lead"("documentsId");
