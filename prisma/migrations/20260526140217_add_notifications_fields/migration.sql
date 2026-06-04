-- AlterTable
ALTER TABLE `Document` ADD COLUMN `notificationsEnabled` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Signature` MODIFY `stampedFile` TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `User` ADD COLUMN `notificationEmail` VARCHAR(191) NULL,
    ADD COLUMN `notificationsEnabled` BOOLEAN NOT NULL DEFAULT true;
