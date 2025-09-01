import Layout from '../../components/Layout';
import HeadSeo from '../../components/HeadSeo';
import JsonLd from '../../components/JsonLd';
import { PrismaClient } from '@prisma/client';
import { SITE_BASE_URL, SITE_BRAND } from '../../lib/seo';
import BookingSummary from '../../components/BookingSummary';
import { useEffect } from 'react';
import { track } from '../../lib/analytics/client';
import { attachUtm } from '../../lib/analytics/utm';
import { generateEventId } from '../../lib/analytics/dedupe';
export const getServerSideProps = async ({ params }) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const prisma = new PrismaClient();
    const id = Number(params === null || params === void 0 ? void 0 : params.id);
    if (Number.isNaN(id))
        return { notFound: true };
    const booking = await prisma.booking.findUnique({ where: { id } });
    await prisma.$disconnect();
    if (!booking)
        return { notFound: true };
    // Temporary compatibility layer: accommodate legacy field names if Prisma client not yet regenerated.
    const b = booking;
    const status = (_a = b.status) !== null && _a !== void 0 ? _a : 'CONFIRMED';
    const car_type = b.car_type;
    const fare_quote_inr = (_c = (_b = b.fare_quote_inr) !== null && _b !== void 0 ? _b : b.total_inr) !== null && _c !== void 0 ? _c : 0;
    const pickupDate = (_e = (_d = b.pickup_datetime) !== null && _d !== void 0 ? _d : b.pickup_at) !== null && _e !== void 0 ? _e : new Date();
    const origin_text = (_g = (_f = b.origin_text) !== null && _f !== void 0 ? _f : b.origin) !== null && _g !== void 0 ? _g : 'Origin';
    const destination_text = (_j = (_h = b.destination_text) !== null && _h !== void 0 ? _h : b.destination) !== null && _j !== void 0 ? _j : 'Destination';
    const payment_mode = (_k = b.payment_mode) !== null && _k !== void 0 ? _k : (b.offer_code ? 'COD' : 'COD');
    return { props: { id: b.id, status, car_type, fare_quote_inr, pickup_datetime: pickupDate.toISOString(), origin_text, destination_text, payment_mode, created_at: b.created_at.toISOString() } };
};
export default function BookingDetail(p) {
    useEffect(() => { const eid = generateEventId(); track('booking_created', attachUtm({ origin: p.origin_text, destination: p.destination_text, car_type: p.car_type, fare: p.fare_quote_inr, booking_id: String(p.id), payment_mode: p.payment_mode || 'COD', event_id: eid })); }, [p.car_type, p.destination_text, p.fare_quote_inr, p.id, p.origin_text, p.payment_mode]);
    const pickupLocal = new Date(p.pickup_datetime).toLocaleString();
    const title = `Booking #${p.id} | ${p.origin_text} → ${p.destination_text}`;
    const description = `Confirmed booking #${p.id} ${p.origin_text} to ${p.destination_text} on ${pickupLocal} • ${p.car_type} • Fare ₹${p.fare_quote_inr} • Pay Cash on Pickup.`;
    const canonical = `${SITE_BASE_URL}/booking/${p.id}`;
    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_BASE_URL + "/" },
            { "@type": "ListItem", "position": 2, "name": "Bookings", "item": SITE_BASE_URL + "/booking" },
            { "@type": "ListItem", "position": 3, "name": `Booking #${p.id}`, "item": canonical }
        ]
    };
    return <Layout><main>
    <HeadSeo title={title} description={description} canonical={canonical}/>
    <JsonLd data={breadcrumbLd}/>
    <header>
      <h1 style={{ marginBottom: 4 }}>✅ Booking Confirmed</h1>
      <p id="booking-tagline" style={{ marginTop: 0 }}>Thank you for choosing {SITE_BRAND}. Your ride is scheduled.</p>
    </header>
    <BookingSummary origin={p.origin_text} destination={p.destination_text} car={p.car_type} fare={p.fare_quote_inr} pickup={p.pickup_datetime}/>
    <section aria-labelledby="payment-h" style={{ marginTop: 24 }}>
      <h2 id="payment-h">Payment</h2>
      <p><strong>Mode:</strong> {p.payment_mode === 'COD' ? 'Cash on Pickup (COD)' : p.payment_mode}</p>
      {p.payment_mode === 'COD' && <p>Kindly pay the driver in cash at pickup. Keep exact change if possible.</p>}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button disabled style={{ opacity: .5, cursor: 'not-allowed' }}>Online Payment (coming soon)</button>
        <a href="/" style={{ alignSelf: 'center' }}>Book another ride</a>
      </div>
    </section>
    <section aria-labelledby="meta-h" style={{ marginTop: 32, fontSize: 12, color: '#555' }}>
      <h2 id="meta-h" style={{ fontSize: 14 }}>Meta</h2>
      <p><strong>ID:</strong> {p.id} • <strong>Status:</strong> {p.status} • Created {new Date(p.created_at).toLocaleString()}</p>
    </section>
  </main></Layout>;
}
