/*
  Warnings:

  - Added the required column `content` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Signature" (
    "id" SERIAL NOT NULL,
    "signature" TEXT NOT NULL,
    "documentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Signature_documentId_idx" ON "Signature"("documentId");

-- CreateIndex
CREATE INDEX "Signature_userId_idx" ON "Signature"("userId");
