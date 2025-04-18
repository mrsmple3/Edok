/*
  Warnings:

  - You are about to drop the column `receiverId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Message` table. All the data in the column will be lost.
  - Added the required column `room` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Message_receiverId_idx` ON `Message`;

-- AlterTable
ALTER TABLE `Message` DROP COLUMN `receiverId`,
    DROP COLUMN `type`,
    ADD COLUMN `room` VARCHAR(191) NOT NULL,
    ADD COLUMN `userId` INTEGER NULL;
