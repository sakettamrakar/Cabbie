import Layout from '../../components/Layout';
import HeadSeo from '../../components/HeadSeo';
import Link from 'next/link';
import { SITE_BASE_URL } from '../../lib/seo';
import { useEffect } from 'react';

export default function BookingIndex(){
  useEffect(()=>{
    const id='brand-font-css';
    if(document.getElementById(id)) return;
    const l=document.createElement('link');
    l.id=id; l.rel='stylesheet'; l.href='/fonts/brand-font.css';
    document.head.appendChild(l);
  },[]);
  return <Layout><main className="brand-font">
    <HeadSeo title="Your Bookings" description="Manage your recent taxi bookings" canonical={`${SITE_BASE_URL}/booking`} />
    <h1>Your Bookings</h1>
    <p>Use your confirmation link to view a booking. Recent booking IDs shown below (feature coming soon).</p>
    <p><Link href="/">Return home</Link></p>
  </main></Layout>;
}
