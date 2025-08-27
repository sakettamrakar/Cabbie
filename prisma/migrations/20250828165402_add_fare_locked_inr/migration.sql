/*
  Warnings:

  - You are about to drop the column `offer_code` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `pax_name` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `pax_phone` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_at` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `total_inr` on the `Booking` table. All the data in the column will be lost.
  - Added the required column `customer_phone` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destination_text` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fare_quote_inr` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origin_text` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickup_datetime` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Driver" ADD COLUMN "vehicle_no" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "route_id" INTEGER NOT NULL,
    "origin_text" TEXT NOT NULL,
    "destination_text" TEXT NOT NULL,
    "pickup_datetime" DATETIME NOT NULL,
    "car_type" TEXT NOT NULL,
    "fare_quote_inr" INTEGER NOT NULL,
    "fare_locked_inr" INTEGER NOT NULL DEFAULT 0,
    "payment_mode" TEXT NOT NULL DEFAULT 'COD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customer_name" TEXT,
    "customer_phone" TEXT NOT NULL,
    "discount_code" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("car_type", "created_at", "id", "route_id") SELECT "car_type", "created_at", "id", "route_id" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
