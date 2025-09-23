import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import adminBookingsHandler from '../pages/api/admin/bookings';
import { runApi } from './apiTestUtils';

const prisma = new PrismaClient();
const TEST_DB_PATH = path.resolve(process.cwd(), 'test.db');
const TEST_ADMIN_KEY = 'test-admin-key';

describe('Admin bookings API', () => {
  const previousAdminKey = process.env.ADMIN_KEY;
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const databaseUrl = process.env.DATABASE_URL || 'file:./test.db?connection_limit=1';
  let latestBookingId: number;
  let earliestBookingId: number;
  let schemaReady = false;

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.rmSync(TEST_DB_PATH);
    }
    process.env.DATABASE_URL = databaseUrl;
    execSync('npx prisma db push --skip-generate', { stdio: 'pipe', env: { ...process.env, DATABASE_URL: databaseUrl } });
    schemaReady = true;
    await prisma.$connect();
    process.env.ADMIN_KEY = TEST_ADMIN_KEY;

    const originCity = await prisma.city.create({
      data: { name: 'Test Origin', slug: 'test-origin', state: 'TS' },
    });
    const destinationCity = await prisma.city.create({
      data: { name: 'Test Destination', slug: 'test-destination', state: 'TS' },
    });
    const route = await prisma.route.create({
      data: {
        origin_city_id: originCity.id,
        destination_city_id: destinationCity.id,
        is_airport_route: false,
      },
    });

    const firstBooking = await prisma.booking.create({
      data: {
        route_id: route.id,
        origin_text: 'Origin Plaza',
        destination_text: 'Destination Central',
        pickup_datetime: new Date('2025-01-11T10:00:00.000Z'),
        car_type: 'SEDAN',
        fare_quote_inr: 1800,
        fare_locked_inr: 1800,
        payment_mode: 'COD',
        status: 'CONFIRMED',
        customer_name: 'Alice Rider',
        customer_phone: '9999999999',
        created_at: new Date('2025-01-10T09:00:00.000Z'),
      },
    });

    const secondBooking = await prisma.booking.create({
      data: {
        route_id: route.id,
        origin_text: 'Origin Plaza',
        destination_text: 'Destination Central',
        pickup_datetime: new Date('2025-01-12T12:30:00.000Z'),
        car_type: 'SUV',
        fare_quote_inr: 2200,
        fare_locked_inr: 2100,
        payment_mode: 'COD',
        status: 'PENDING',
        customer_name: 'Bob Traveller',
        customer_phone: '8888888888',
        created_at: new Date('2025-01-11T11:00:00.000Z'),
      },
    });

    earliestBookingId = firstBooking.id;
    latestBookingId = secondBooking.id;
  });

  afterAll(async () => {
    if (previousAdminKey === undefined) {
      delete process.env.ADMIN_KEY;
    } else {
      process.env.ADMIN_KEY = previousAdminKey;
    }
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
    if (schemaReady) {
      try {
        await prisma.booking.deleteMany();
        await prisma.route.deleteMany();
        await prisma.city.deleteMany();
      } catch (error) {
        // Ignore cleanup errors when schema was not fully initialized.
      }
    }
    await prisma.$disconnect();
  });

  test('persists bookings and exposes them via admin endpoint', async () => {
    const total = await prisma.booking.count();
    expect(total).toBeGreaterThanOrEqual(2);

    const firstPage = await runApi(adminBookingsHandler, 'GET', undefined, {
      query: { page: '1', pageSize: '1', key: TEST_ADMIN_KEY },
    });
    expect(firstPage.status).toBe(200);
    expect(firstPage.data.ok).toBe(true);
    expect(firstPage.data.page).toBe(1);
    expect(firstPage.data.pageSize).toBe(1);
    expect(firstPage.data.total).toBeGreaterThanOrEqual(2);
    expect(firstPage.data.bookings).toHaveLength(1);
    expect(firstPage.data.bookings[0].booking_id).toBe(latestBookingId);
    expect(firstPage.data.bookings[0].customer_phone).toBe('8888888888');
    expect(firstPage.data.bookings[0].fare).toBe(2100);
    expect(firstPage.data.bookings[0].status).toBe('PENDING');

    const secondPage = await runApi(adminBookingsHandler, 'GET', undefined, {
      query: { page: '2', pageSize: '1', key: TEST_ADMIN_KEY },
    });
    expect(secondPage.status).toBe(200);
    expect(secondPage.data.ok).toBe(true);
    expect(secondPage.data.bookings[0].booking_id).toBe(earliestBookingId);
    expect(secondPage.data.bookings[0].status).toBe('CONFIRMED');
  });
});
