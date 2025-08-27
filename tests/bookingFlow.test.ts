import { runApi } from './apiTestUtils';
import sendHandler from '../pages/api/otp/send';
import verifyHandler from '../pages/api/otp/verify';
import bookingHandler from '../pages/api/bookings';

// Note: This test assumes dev mode exposing devOtp.

describe('End-to-end booking flow (OTP -> booking)', () => {
  let phone = '+911234567890';
  let otp: string;
  let bookingId: number;

  test('send otp', async () => {
    const { status, data } = await runApi(sendHandler, 'POST', { phone });
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
    expect(typeof data.message).toBe('string');
    expect(data.devOtp).toMatch(/^[0-9]{4,6}$/);
    otp = data.devOtp;
  });

  test('verify otp', async () => {
    const { status, data } = await runApi(verifyHandler, 'POST', { phone, otp });
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.valid).toBe(true);
  });

  test('create booking', async () => {
    const pickup = new Date(Date.now()+3600_000).toISOString();
    const { status, data } = await runApi(bookingHandler, 'POST', { phone, otp, routeId:1, carType:'SEDAN', pickup_datetime:pickup, origin_text:'City A', destination_text:'City B' });
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.status).toBeDefined();
    bookingId = data.booking_id;
    expect(bookingId).toBeGreaterThan(0);
  });
});
