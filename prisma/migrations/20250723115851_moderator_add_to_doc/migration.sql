-- AlterTable
ALTER TABLE `Document` ADD COLUMN `moderatorId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Document_moderatorId_idx` ON `Document`(`moderatorId`);
