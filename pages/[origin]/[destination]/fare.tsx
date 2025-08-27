import { GetStaticPaths, GetStaticProps } from 'next';
import { useState, useEffect } from 'react';
import HeadSeo from '../../../components/HeadSeo';
import JsonLd from '../../../components/JsonLd';
import FareCard from '../../../components/FareCard';
import dynamic from 'next/dynamic';
import FaqList, { Faq } from '../../../components/FaqList';
import Layout from '../../../components/Layout';
import { fetchRoutes, fetchRouteBySlugs, fetchContentToken, fetchRouteLastUpdated, disconnect } from '../../../lib/data';
import { relatedRoutes } from '../../../lib/links';
import { canonicalFare, metaDescriptionFare, canonicalSeo, SITE_BASE_URL, SITE_BRAND } from '../../../lib/seo';
import { alternateForReverseRoute } from '../../../lib/canon';
import { faqJsonLd, taxiServiceSchema, breadcrumbSchema } from '../../../lib/schema';
import { track } from '../../../lib/analytics/client';
import { routePath, translate } from '../../../lib/i18n';
import { titleVariantForRoute, buildFareTitle } from '../../../lib/ab';

export const revalidate = 86400; // 24h ISR

interface FarePageProps {
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  fares: { car_type:string; base:number }[];
  highlights: string[];
  faqs: Faq[];
  related: { origin:string; destination:string }[];
  routeId: number;
  updatedOn: string;
}

export const getStaticPaths: GetStaticPaths = async ()=>{
  const routes = await fetchRoutes();
  const paths = routes.map((r:any)=>({ params:{ origin:r.origin.slug, destination:r.destination.slug }}));
  await disconnect();
  return { paths, fallback:'blocking' };
};

export const getStaticProps: GetStaticProps<FarePageProps & { inactive?:boolean }> = async ({ params, preview }) => {
  const origin = params?.origin as string; const destination = params?.destination as string;
  const bundle = await fetchRouteBySlugs(origin,destination);
  const buildTime = new Date();
  if(!bundle){ await disconnect(); return { props:{ origin, destination, distance:0, duration:0, fares:[], highlights:[], faqs:[], related:[], routeId:0, inactive:true, updatedOn: buildTime.toISOString() }, revalidate:3600 } as any; }
  const { route } = bundle;
  const hl = await fetchContentToken(`highlights:${origin}-${destination}`);
  const faqs = await fetchContentToken(`faqs:${origin}-${destination}`);
  // Simple related: reverse + same-origin others (first 3)
  const related = await relatedRoutes(origin,destination);
  const fares = route.fares.sort((a:any,b:any)=>a.base_fare_inr-b.base_fare_inr).map((f:any)=>({ car_type:f.car_type, base:f.base_fare_inr }));
  const updatedDate = await fetchRouteLastUpdated(origin,destination);
  if(process.env.NODE_ENV!=='production'){
    // Debug log to verify data at build time / ISR
    console.log('[fare:getStaticProps]', origin, destination, 'fares=', fares.length, 'routeId=', route.id);
  }
  await disconnect();
  return { props:{ origin, destination, distance:route.distance_km||0, duration:route.duration_min||0, fares, highlights:hl?.highlights||[], faqs:faqs?.faqs||[], related, routeId: route.id, updatedOn: updatedDate.toISOString() }, revalidate };
};

const BookingIsland = dynamic(()=>import('../../../components/booking/BookingIsland'),{ ssr:false, loading:()=> <div style={{border:'1px solid #ddd',padding:16,borderRadius:6,maxWidth:420}} aria-busy="true" aria-live="polite">
  <strong>Loading booking form…</strong>
  <div style={{marginTop:8,display:'grid',gap:8}}>
    {Array.from({length:6}).map((_,i)=><div key={i} style={{height:32,background:'#f1f5f9',borderRadius:4}} />)}
    <div style={{height:40,background:'#e2e8f0',borderRadius:4}} />
  </div>
</div>});

export default function FarePage({ origin, destination, distance, duration, fares, highlights, faqs, related, routeId, inactive, updatedOn }: FarePageProps & { inactive?:boolean }){
  const canonical = canonicalFare(origin,destination);
  const description = metaDescriptionFare(origin,destination,distance,duration);
  const faqLd = faqJsonLd(faqs);
  const offers = fares.map(f=>({ name: f.car_type, priceInr: f.base }));
  const taxiSvc = taxiServiceSchema({ origin, destination, offers });
  const breadcrumbs = breadcrumbSchema([
    { name:'Home', url: SITE_BASE_URL+'/' },
    { name: origin, url: `${SITE_BASE_URL}/city/${origin}` },
    { name: `${origin} to ${destination} Fare`, url: canonical }
  ]);
  const jsonLd = [ taxiSvc, breadcrumbs, faqLd ].filter(Boolean);
  const reverse = alternateForReverseRoute(origin,destination);
  const alternates = [{ href: reverse.fare, hrefLang:'en' }];
  if(process.env.ENABLE_HI_LOCALE==='1'){
    try { const pathName = new URL(canonical).pathname; alternates.push({ href: SITE_BASE_URL + routePath('hi', pathName), hrefLang:'hi-IN' }); } catch {}
  }
  const variant = titleVariantForRoute(origin,destination);
  const pageTitle = buildFareTitle(origin,destination, fares[0]?.base, variant, SITE_BRAND);
  const [selectedCar, setSelectedCar] = useState<string>(fares[0]?.car_type || 'HATCHBACK');
  const [bookingVisible,setBookingVisible]=useState(false);
  const [liveFares,setLiveFares]=useState(fares);
  const [fareError,setFareError]=useState<string|undefined>();
  const [loadingFares,setLoadingFares]=useState(false);
  const lastUpdatedHours = Math.max(0, Math.round((Date.now() - new Date(updatedOn).getTime())/36e5));
  // Track quote viewed on mount (first fare in list)
  useEffect(()=>{
    if(fares[0]) track('quote_viewed',{ origin, destination, car_type: fares[0].car_type, fare: fares[0].base });
    // Attempt live fare refresh (network) with fallback to static props
    async function refresh(){
      setLoadingFares(true);
      try {
        const r = await fetch(`/api/fares/${origin}/${destination}`);
        if(!r.ok) throw new Error('Network');
        const j = await r.json();
        if(j && Array.isArray(j.fares)){
          const mapped = j.fares.map((f:any)=>({ car_type:f.car_type, base:f.base_fare_inr||f.base }));
          if(mapped.length){ setLiveFares(mapped); setFareError(undefined); }
        }
      } catch(e:any){
        setFareError('Showing cached fare – live update unavailable.');
      } finally { setLoadingFares(false); }
    }
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  function revealBooking(car:string){
    setSelectedCar(car);
    setBookingVisible(true);
    const el = document.getElementById('booking');
    if(el) el.scrollIntoView({ behavior:'smooth', block:'start' });
  }
  // Progressive hydration: if user scrolls near booking anchor, pre-load island
  useEffect(()=>{
    if(bookingVisible) return;
    const target = document.getElementById('booking');
    if(!target) return;
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting){ setBookingVisible(true); io.disconnect(); }});
    },{ rootMargin:'400px 0px' });
    io.observe(target);
    return ()=> io.disconnect();
  },[bookingVisible]);
  return (
  <Layout>
  <main role="main">
  <HeadSeo title={pageTitle} description={description} canonical={canonical} robots={inactive? 'noindex,follow':'index,follow'} alternates={alternates}>
        <JsonLd data={jsonLd} />
      </HeadSeo>
      <header>
        <nav aria-label="Breadcrumb" className="breadcrumb"><ol style={{listStyle:'none',padding:0,margin:0,display:'flex',flexWrap:'wrap',gap:4}}>
          <li><a href="/">Home</a> /</li>
          <li><a href={`/city/${origin}`}>{origin}</a> /</li>
          <li aria-current="page"><strong>{origin} → {destination} Fare</strong></li>
        </ol></nav>
        <h1 style={{marginBottom:4}}>{origin} to {destination} Taxi Fare</h1>
  <p className="header-sub">{distance} km • ~{duration} mins • Fixed, all-inclusive</p>
  <p style={{fontSize:12,marginTop:4,color:'#555'}}>{translate('updated_on')} {new Date(updatedOn).toLocaleDateString(undefined,{ day:'numeric', month:'long', year:'numeric' })}</p>
      </header>
      <section aria-labelledby="fareCardsHeading">
        <h2 id="fareCardsHeading">Fares</h2>
        <div className="fares-wrap" aria-busy={loadingFares? 'true': undefined}>
          {loadingFares && liveFares.length===0 && Array.from({length:3}).map((_,i)=>(
            <div key={i} style={{border:'1px solid #e2e8f0',padding:12,borderRadius:6,width:200}}>
              <div className="skeleton" style={{height:18,width:'60%',marginBottom:8,borderRadius:4}} />
              <div className="skeleton" style={{height:14,width:'40%',marginBottom:4,borderRadius:4}} />
              <div className="skeleton" style={{height:32,width:'100%',borderRadius:6}} />
            </div>
          ))}
          {liveFares.map(f=> <div key={f.car_type} className="fare-actions">
            <FareCard carType={f.car_type} baseFare={f.base} distanceKm={distance} durationMin={duration} />
            <button onClick={()=>revealBooking(f.car_type)} aria-label={`Book ${f.car_type}`} className="book-btn">Book {f.car_type}</button>
          </div>)}
        </div>
        <p style={{marginTop:12,fontSize:12}}>Select a car type to open the booking form below.</p>
        <div style={{fontSize:12,color: fareError? '#b00':'#555'}} aria-live="polite">
          {fareError? `${fareError} Fare last updated ${lastUpdatedHours}h ago.` : `Fare data refreshed. Last updated ${lastUpdatedHours}h ago.`}
        </div>
      </section>
      <section id="booking" style={{marginTop:32}} aria-labelledby="bookingHeading">
        <h2 id="bookingHeading" style={{position:'absolute',left:'-9999px',top:'auto',width:1,height:1,overflow:'hidden'}}>Booking</h2>
        {!bookingVisible && <div className="booking-placeholder">
          <p style={{marginBottom:8}}><strong>Ready to book?</strong></p>
          <p>Pick a car above or <button onClick={()=>setBookingVisible(true)} className="booking-open-btn">Open Booking Form</button>.</p>
        </div>}
        {bookingVisible && <BookingIsland routeId={routeId} preselectedCarType={selectedCar as any} defaultOrigin={origin} defaultDestination={destination} onBooked={(id)=>{ window.location.assign(`/booking/${id}`); }} />}
        <noscript>
          <form method="post" action="/api/v1/bookings/pe" style={{marginTop:24,background:'#fff',padding:16,border:'1px solid #e2e8f0',borderRadius:8,maxWidth:420}}>
            <h2 style={{marginTop:0}}>Book (No JS)</h2>
            <input type="hidden" name="route_id" value={routeId} />
            <input type="hidden" name="car_type" value={fares[0]?.car_type||'HATCHBACK'} />
            <input type="hidden" name="origin_text" value={origin} />
            <input type="hidden" name="destination_text" value={destination} />
            <div><label>Pickup Date/Time <input type="datetime-local" name="pickup_datetime" required /></label></div>
            <div style={{marginTop:8}}><label>Phone <input name="customer_phone" pattern="[0-9]{10}" required /></label></div>
            <div style={{marginTop:8}}><label>Name <input name="customer_name" /></label></div>
            <p style={{fontSize:12,color:'#555'}}>OTP verification skipped (fallback). Phone will be verified manually.</p>
            <button type="submit">Submit Booking</button>
          </form>
        </noscript>
      </section>
      <section style={{marginTop:40}} aria-labelledby="highlightsHeading" className="no-shift h-160">
        <h2 id="highlightsHeading">Why ride with us?</h2>
        {highlights?.length>0 ? <ul>{highlights.map((h,i)=><li key={i}>{h}</li>)}</ul> :
          <div>
            <div className="skeleton-line" style={{width:'60%'}} />
            <div className="skeleton-line" style={{width:'70%'}} />
            <div className="skeleton-line" style={{width:'55%'}} />
          </div>}
      </section>
      <section style={{marginTop:40}} aria-labelledby="relatedHeading" className="no-shift h-120">
        <h2 id="relatedHeading">Related Routes</h2>
  {related?.length>0 ? <ul>{related.map((r,i)=><li key={i}><a href={`/${r.origin}/${r.destination}/fare`}>{r.origin} → {r.destination}</a></li>)}</ul> :
          <div>
            <div className="skeleton-line" style={{width:'40%'}} />
            <div className="skeleton-line" style={{width:'50%'}} />
            <div className="skeleton-line" style={{width:'45%'}} />
          </div>}
      </section>
      <FaqList faqs={faqs} headingLevel={2} />
      <footer style={{marginTop:60,fontSize:12,color:'#555'}} role="contentinfo">
        <p><strong>Canonical:</strong> <a href={canonical}>{canonical}</a></p>
        <p><strong>SEO page:</strong> <a href={canonicalSeo(origin,destination)}>{origin} to {destination} taxi</a></p>
      </footer>
  </main>
  </Layout>
  );
}

// Prop Token Mapping Example:
// origin -> {Origin} token, destination -> {Destination}, fares -> {FareCards}, highlights -> {Highlights}, faqs -> {FAQs}
