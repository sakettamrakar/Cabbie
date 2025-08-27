import { GetServerSideProps } from 'next';
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

interface BookingDetailProps { id:number; status:string; car_type:string; fare_quote_inr:number; pickup_datetime:string; origin_text:string; destination_text:string; payment_mode:string; created_at:string; }

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const prisma = new PrismaClient();
  const id = Number(params?.id);
  if(Number.isNaN(id)) return { notFound:true };
  const booking = await prisma.booking.findUnique({ where:{ id }});
  await prisma.$disconnect();
  if(!booking) return { notFound:true };
  // Temporary compatibility layer: accommodate legacy field names if Prisma client not yet regenerated.
  const b:any = booking as any;
  const status = b.status ?? 'CONFIRMED';
  const car_type = b.car_type;
  const fare_quote_inr = b.fare_quote_inr ?? b.total_inr ?? 0;
  const pickupDate: Date = b.pickup_datetime ?? b.pickup_at ?? new Date();
  const origin_text = b.origin_text ?? b.origin ?? 'Origin';
  const destination_text = b.destination_text ?? b.destination ?? 'Destination';
  const payment_mode = b.payment_mode ?? (b.offer_code ? 'COD' : 'COD');
  return { props:{ id:b.id, status, car_type, fare_quote_inr, pickup_datetime:pickupDate.toISOString(), origin_text, destination_text, payment_mode, created_at: b.created_at.toISOString() } };
};

export default function BookingDetail(p:BookingDetailProps){
  useEffect(()=>{ const eid = generateEventId(); track('booking_created', attachUtm({ origin: p.origin_text, destination: p.destination_text, car_type: p.car_type, fare: p.fare_quote_inr, booking_id: String(p.id), payment_mode: p.payment_mode||'COD', event_id: eid } as any)); },[]);
  const pickupLocal = new Date(p.pickup_datetime).toLocaleString();
  const title = `Booking #${p.id} | ${p.origin_text} → ${p.destination_text}`;
  const description = `Confirmed booking #${p.id} ${p.origin_text} to ${p.destination_text} on ${pickupLocal} • ${p.car_type} • Fare ₹${p.fare_quote_inr} • Pay Cash on Pickup.`;
  const canonical = `${SITE_BASE_URL}/booking/${p.id}`;
  const breadcrumbLd = {
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    "itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item":SITE_BASE_URL+"/"},
      {"@type":"ListItem","position":2,"name":"Bookings","item":SITE_BASE_URL+"/booking"},
      {"@type":"ListItem","position":3,"name":`Booking #${p.id}`,"item":canonical}
    ]
  };
  return <Layout><main>
    <HeadSeo title={title} description={description} canonical={canonical} />
    <JsonLd data={breadcrumbLd} />
    <header>
      <h1 style={{marginBottom:4}}>✅ Booking Confirmed</h1>
      <p id="booking-tagline" style={{marginTop:0}}>Thank you for choosing {SITE_BRAND}. Your ride is scheduled.</p>
    </header>
    <BookingSummary origin={p.origin_text} destination={p.destination_text} car={p.car_type} fare={p.fare_quote_inr} pickup={p.pickup_datetime} />
    <section aria-labelledby="payment-h" style={{marginTop:24}}>
      <h2 id="payment-h">Payment</h2>
      <p><strong>Mode:</strong> {p.payment_mode === 'COD' ? 'Cash on Pickup (COD)' : p.payment_mode}</p>
      {p.payment_mode === 'COD' && <p>Kindly pay the driver in cash at pickup. Keep exact change if possible.</p>}
      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
        <button disabled style={{opacity:.5,cursor:'not-allowed'}}>Online Payment (coming soon)</button>
        <a href="/" style={{alignSelf:'center'}}>Book another ride</a>
      </div>
    </section>
    <section aria-labelledby="meta-h" style={{marginTop:32,fontSize:12,color:'#555'}}>
      <h2 id="meta-h" style={{fontSize:14}}>Meta</h2>
      <p><strong>ID:</strong> {p.id} • <strong>Status:</strong> {p.status} • Created {new Date(p.created_at).toLocaleString()}</p>
    </section>
  </main></Layout>;
}
