/*
  Warnings:

  - You are about to drop the column `address` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `agreed_to_terms` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `bank_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `business_activity` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `district` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `iban` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `mfo` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `partner_organization` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "address",
DROP COLUMN "agreed_to_terms",
DROP COLUMN "bank_name",
DROP COLUMN "business_activity",
DROP COLUMN "city",
DROP COLUMN "district",
DROP COLUMN "iban",
DROP COLUMN "mfo",
DROP COLUMN "partner_organization",
DROP COLUMN "region",
ADD COLUMN     "organization_INN" TEXT,
ADD COLUMN     "organization_name" TEXT;
