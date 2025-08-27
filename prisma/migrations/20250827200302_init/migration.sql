-- CreateTable
CREATE TABLE "City" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "airport_code" TEXT,
    "airport_city_slug" TEXT,
    "lat" REAL,
    "lon" REAL,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Route" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "origin_city_id" INTEGER NOT NULL,
    "destination_city_id" INTEGER NOT NULL,
    "is_airport_route" BOOLEAN NOT NULL DEFAULT false,
    "distance_km" REAL,
    "duration_min" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Route_origin_city_id_fkey" FOREIGN KEY ("origin_city_id") REFERENCES "City" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Route_destination_city_id_fkey" FOREIGN KEY ("destination_city_id") REFERENCES "City" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fare" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "route_id" INTEGER NOT NULL,
    "car_type" TEXT NOT NULL,
    "base_fare_inr" INTEGER NOT NULL,
    "night_surcharge_pct" INTEGER NOT NULL DEFAULT 0,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Fare_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "scope" TEXT,
    "targetId" INTEGER,
    "json" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discount_pct" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" DATETIME,
    "valid_to" DATETIME
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "car_type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "route_id" INTEGER NOT NULL,
    "pickup_at" DATETIME NOT NULL,
    "pax_name" TEXT NOT NULL,
    "pax_phone" TEXT NOT NULL,
    "car_type" TEXT NOT NULL,
    "offer_code" TEXT,
    "total_inr" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "booking_id" INTEGER NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assignment_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Assignment_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "Driver" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Route_origin_city_id_destination_city_id_key" ON "Route"("origin_city_id", "destination_city_id");

-- CreateIndex
CREATE UNIQUE INDEX "ContentToken_key_key" ON "ContentToken"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_code_key" ON "Offer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_phone_key" ON "Driver"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_booking_id_driver_id_key" ON "Assignment"("booking_id", "driver_id");
