"use strict";
// Jest setup: ensure predictable env values (avoid writing to read-only NODE_ENV in TS types)
if (!process.env.REDIS_URL)
    process.env.REDIS_URL = '';
if (!process.env.DATABASE_URL)
    process.env.DATABASE_URL = 'postgresql://postgres:betsson123@localhost:5432/postgres';
