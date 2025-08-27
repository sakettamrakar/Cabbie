/*
  Warnings:

  - You are about to drop the column `discount_pct` on the `Offer` table. All the data in the column will be lost.
  - Added the required column `discount_type` to the `Offer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `Offer` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Offer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "discount_type" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "cap_inr" INTEGER,
    "conditions" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" DATETIME,
    "valid_to" DATETIME
);
INSERT INTO "new_Offer" ("active", "code", "description", "id", "title", "valid_from", "valid_to") SELECT "active", "code", "description", "id", "title", "valid_from", "valid_to" FROM "Offer";
DROP TABLE "Offer";
ALTER TABLE "new_Offer" RENAME TO "Offer";
CREATE UNIQUE INDEX "Offer_code_key" ON "Offer"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
