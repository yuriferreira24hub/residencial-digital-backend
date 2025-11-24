/*
  Warnings:

  - You are about to drop the column `addressNumber` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `construction` on the `Property` table. All the data in the column will be lost.
  - Made the column `address` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `zipCode` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `Property` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Property" DROP COLUMN "addressNumber",
DROP COLUMN "construction",
ADD COLUMN     "constructionYear" INTEGER,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "riskCategory" TEXT,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL,
ALTER COLUMN "zipCode" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL;

-- AlterTable
ALTER TABLE "Quote" ALTER COLUMN "status" SET DEFAULT 'pending';
