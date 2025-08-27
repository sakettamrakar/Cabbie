-- Portable SQL reference (mirrors Prisma models; not executed automatically)
CREATE TABLE IF NOT EXISTS cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  state TEXT NOT NULL,
  airport_code TEXT,
  airport_city_slug TEXT,
  lat REAL,
  lon REAL,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  origin_city_id INT NOT NULL,
  destination_city_id INT NOT NULL,
  is_airport_route INT DEFAULT 0,
  distance_km REAL,
  duration_min INT,
  is_active INT DEFAULT 1,
  UNIQUE(origin_city_id, destination_city_id)
);

CREATE TABLE IF NOT EXISTS fares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id INT NOT NULL,
  car_type TEXT CHECK(car_type IN ('HATCHBACK','SEDAN','SUV')),
  base_fare_inr INT NOT NULL,
  night_surcharge_pct INT DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);