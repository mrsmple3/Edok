-- CreateTable
CREATE TABLE `DocumentDeleteSign` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `documentId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DocumentDeleteSign_documentId_idx`(`documentId`),
    INDEX `DocumentDeleteSign_userId_idx`(`userId`),
    UNIQUE INDEX `DocumentDeleteSign_documentId_userId_key`(`documentId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
