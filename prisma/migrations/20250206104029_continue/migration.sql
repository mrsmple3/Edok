/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `address` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `agreed_to_terms` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bank_name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_activity` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_type` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iban` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mfo` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partner_organization` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password_hash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "agreed_to_terms" BOOLEAN NOT NULL,
ADD COLUMN     "bank_name" TEXT NOT NULL,
ADD COLUMN     "business_activity" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "company_type" TEXT NOT NULL,
ADD COLUMN     "district" TEXT NOT NULL,
ADD COLUMN     "iban" TEXT NOT NULL,
ADD COLUMN     "mfo" TEXT NOT NULL,
ADD COLUMN     "partner_organization" TEXT NOT NULL,
ADD COLUMN     "password_hash" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "region" TEXT NOT NULL;
