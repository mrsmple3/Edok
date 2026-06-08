-- CreateTable
CREATE TABLE `NotificationRecipient` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `NotificationRecipient_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed: ответственные за контрагентов (стартовый список)
INSERT INTO `NotificationRecipient` (`email`, `label`, `enabled`) VALUES
    ('hurrem-zakyp@ukr.net', NULL, true),
    ('hurrem_bukh@ukr.net', NULL, true),
    ('hurrem_snab@ukr.net', NULL, true);
