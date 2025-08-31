import bookingHandler from '../pages/api/bookings';
import sendHandler from '../pages/api/otp/send';
import verifyHandler from '../pages/api/otp/verify';
import { runApi } from '../tests/apiTestUtils';
// Mock sendServerEvent to capture payload
jest.mock('../lib/analytics/mp', () => ({ sendServerEvent: jest.fn(async (_) => { }) }));
import { sendServerEvent } from '../lib/analytics/mp';
const HASH_SALT_ENV = process.env.BOOKING_HASH_SALT;
process.env.BOOKING_HASH_SALT = 'test_salt';
describe('analytics booking flow', () => {
    let otp;
    let phone = '1234567890';
    test('otp send + verify + booking emits server MP event without PII', async () => {
        var _a;
        const send = await runApi(sendHandler, 'POST', { phone });
        expect(send.status).toBe(200);
        otp = send.data.devOtp;
        const verify = await runApi(verifyHandler, 'POST', { phone, otp });
        expect(verify.data.ok).toBe(true);
        const pickup = new Date(Date.now() + 3600000).toISOString();
        const booking = await runApi(bookingHandler, 'POST', { otp_token: otp, customer_phone: phone, route_id: 1, car_type: 'SEDAN', pickup_datetime: pickup, origin_text: 'city-a', destination_text: 'city-b', fare_quote_inr: 100, discount_code: null, payment_mode: 'COD' });
        expect(booking.status).toBe(201);
        expect(booking.data.booking_id).toBeGreaterThan(0);
        const calls = sendServerEvent.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const evt = (_a = calls.find(c => c[0].name === 'booking_created')) === null || _a === void 0 ? void 0 : _a[0];
        expect(evt).toBeDefined();
        // Ensure no raw phone or name present in params
        const params = evt.params;
        expect(params.customer_phone).toBeUndefined();
        expect(params.customer_name).toBeUndefined();
        expect(params.booking_id_hash).toMatch(/^[a-f0-9]{64}$/);
    });
    afterAll(() => { process.env.BOOKING_HASH_SALT = HASH_SALT_ENV; });
});
