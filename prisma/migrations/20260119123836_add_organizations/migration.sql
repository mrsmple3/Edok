/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Document` DROP COLUMN `deletedAt`,
    DROP COLUMN `isDeleted`;

-- AlterTable
ALTER TABLE `Lead` ADD COLUMN `organizationId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Signature` MODIFY `stampedFile` TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `User` ADD COLUMN `organizationId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Organization` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `inn` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Organization_inn_key`(`inn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Lead_organizationId_idx` ON `Lead`(`organizationId`);

-- CreateIndex
CREATE INDEX `User_organizationId_idx` ON `User`(`organizationId`);
