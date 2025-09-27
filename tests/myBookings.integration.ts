import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { createMocks } from 'node-mocks-http';
import { createOtpSession } from '../lib/otpSession';
import { getPricingQuote } from '../lib/pricing';

function extractCookie(header: string | string[] | number | undefined): string | null {
  if (!header) {
    return null;
  }
  const parts = Array.isArray(header) ? header : [String(header)];
  return parts
    .map((cookie) => cookie.split(';')[0])
    .filter(Boolean)
    .join('; ');
}

async function run(): Promise<number> {
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  process.env.FEATURE_MY_BOOKINGS = 'true';
  process.env.NEXT_PUBLIC_FEATURE_MY_BOOKINGS = 'true';
  process.env.MB_SESSION_SECRET = process.env.MB_SESSION_SECRET || 'integration-secret';
  process.env.MB_SESSION_TTL_HOURS = process.env.MB_SESSION_TTL_HOURS || '24';
  process.env.OTP_BYPASS = 'true';

  const phone = '9998800001';
  const prisma = new PrismaClient();
  let exitCode = 0;

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set to a Postgres connection string');
    }

    await prisma.$connect();

    const origin = await prisma.city.upsert({
      where: { slug: 'manage-test-origin' },
      update: {},
      create: { name: 'Manage Test Origin', slug: 'manage-test-origin', state: 'TS' },
    });

    const destination = await prisma.city.upsert({
      where: { slug: 'manage-test-destination' },
      update: {},
      create: { name: 'Manage Test Destination', slug: 'manage-test-destination', state: 'TS' },
    });

    const route = await prisma.route.upsert({
      where: {
        origin_city_id_destination_city_id: {
          origin_city_id: origin.id,
          destination_city_id: destination.id,
        },
      },
      update: {},
      create: {
        origin_city_id: origin.id,
        destination_city_id: destination.id,
        is_airport_route: false,
      },
    });

    const { default: bookingHandler } = await import('../pages/api/bookings');
    const { default: otpVerifyHandler } = await import('../pages/api/otp/verify');
    const { default: myBookingsHandler } = await import('../pages/api/my-bookings/index');

    const basePickup = Date.now() + 60 * 60 * 1000;

    for (let i = 0; i < 3; i += 1) {
      const pickupIso = new Date(basePickup + i * 60 * 60 * 1000).toISOString();
      const quote = await getPricingQuote({
        origin_text: 'manage-test-origin',
        destination_text: 'manage-test-destination',
        pickup_datetime: pickupIso,
        car_type: 'SEDAN',
      });

      if (quote.route_id !== route.id) {
        throw new Error('Quote route mismatch – ensure Prisma is connected to Postgres');
      }

      const otpSession = await createOtpSession(phone);

      const { req, res } = createMocks({
        method: 'POST',
        headers: { 'idempotency-key': randomUUID() },
        body: {
          route_id: route.id,
          origin_text: 'manage-test-origin',
          destination_text: 'manage-test-destination',
          pickup_datetime: pickupIso,
          car_type: 'SEDAN',
          fare_quote_inr: quote.fare_after_discount_inr,
          customer_phone: phone,
          customer_name: `Integration User ${i + 1}`,
          payment_mode: 'COD',
          otp_token: otpSession.token,
        },
      });

      await bookingHandler(req as any, res as any);

      if (res._getStatusCode() !== 201) {
        exitCode = 1;
        throw new Error(`Booking API failed: ${res._getData()}`);
      }
    }

    const { req: verifyReq, res: verifyRes } = createMocks({
      method: 'POST',
      body: { phone, otp: '1234', context: 'manage' },
    });

    await otpVerifyHandler(verifyReq as any, verifyRes as any);

    if (verifyRes._getStatusCode() !== 200) {
      exitCode = 1;
      throw new Error(`OTP verification failed: ${verifyRes._getData()}`);
    }

    const cookieHeader = extractCookie(verifyRes.getHeader('Set-Cookie'));
    if (!cookieHeader) {
      exitCode = 1;
      throw new Error('Expected manage session cookie to be issued');
    }

    const { req: listReq, res: listRes } = createMocks({
      method: 'GET',
      headers: { cookie: cookieHeader },
    });

    await myBookingsHandler(listReq as any, listRes as any);

    if (listRes._getStatusCode() !== 200) {
      exitCode = 1;
      throw new Error(`My bookings API failed: ${listRes._getData()}`);
    }

    const payload = listRes._getJSONData();
    if (!payload || !Array.isArray(payload.bookings) || payload.bookings.length < 2) {
      exitCode = 1;
      throw new Error('Expected at least two bookings in API response');
    }

    const prismaCheck = new PrismaClient();
    await prismaCheck.$connect();
    const persistedCount = await prismaCheck.booking.count({ where: { customer_phone: phone } });
    await prismaCheck.$disconnect();

    if (persistedCount < 2) {
      exitCode = 1;
      throw new Error('Bookings did not persist after reconnecting to Postgres');
    }

    console.log('PASS my bookings integration');
  } catch (error) {
    exitCode = exitCode || 1;
    console.error('FAIL my bookings integration');
    console.error(error instanceof Error ? error.stack || error.message : error);
  } finally {
    await prisma.booking.deleteMany({ where: { customer_phone: phone } }).catch(() => {});
    await prisma.$disconnect().catch(() => {});
  }

  return exitCode;
}

run()
  .then((code) => {
    process.exit(code);
  })
  .catch((error) => {
    console.error('FAIL my bookings integration');
    console.error(error instanceof Error ? error.stack || error.message : error);
    process.exit(1);
  });
