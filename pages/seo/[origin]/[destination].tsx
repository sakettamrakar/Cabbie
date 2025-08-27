import { GetStaticPaths, GetStaticProps } from 'next';
import HeadSeo from '../../../components/HeadSeo';
import JsonLd from '../../../components/JsonLd';
import Layout from '../../../components/Layout';
import FaqList, { Faq } from '../../../components/FaqList';
import FareCard from '../../../components/FareCard';
import dynamic from 'next/dynamic';
import { fetchRoutes, fetchRouteBySlugs, fetchContentToken, fetchRouteLastUpdated, disconnect } from '../../../lib/data';
import { canonicalSeo, canonicalFare, metaDescriptionFare, SITE_BRAND, SITE_BASE_URL } from '../../../lib/seo';
import { alternateForReverseRoute } from '../../../lib/canon';
import { routePath, translate } from '../../../lib/i18n';
import { titleVariantForRoute } from '../../../lib/ab';
import { faqJsonLd, taxiServiceSchema } from '../../../lib/schema';

export const revalidate = 86400;
interface RouteSeoProps {
  origin:string; destination:string; distance:number; duration:number; fares:{car_type:string;base:number}[]; faqs:Faq[]; highlights:string[]; intro:string; pickupPoints:string[]; dropPoints:string[]; words:string; ctas:{ href:string; label:string }[]; routeId:number;
  updatedOn: string;
}
export const getStaticPaths: GetStaticPaths = async ()=>{
  const routes=await fetchRoutes();
  const paths=routes.map((r:any)=>({ params:{ origin:r.origin.slug, destination:r.destination.slug }}));
  await disconnect();
  return { paths, fallback:'blocking' };
};
export const getStaticProps: GetStaticProps<RouteSeoProps & { inactive?:boolean }> = async ({ params })=>{
  const origin=params?.origin as string; const destination=params?.destination as string;
  const bundle=await fetchRouteBySlugs(origin,destination);
  const buildTime=new Date();
  if(!bundle){ await disconnect(); return { props:{ origin,destination,distance:0,duration:0,fares:[],faqs:[],highlights:[],intro:'',pickupPoints:[],dropPoints:[],words:'',ctas:[],routeId:0,inactive:true, updatedOn: buildTime.toISOString() }, revalidate:3600 } as any; }
  const { route } = bundle;
  const faqs=await fetchContentToken(`faqs:${origin}-${destination}`) || { faqs:[] };
  const hl=await fetchContentToken(`highlights:${origin}-${destination}`) || { highlights:[] };
  await disconnect();
  const fares=route.fares.sort((a:any,b:any)=>a.base_fare_inr-b.base_fare_inr).map((f:any)=>({car_type:f.car_type, base:f.base_fare_inr}));
  // Tokenized intro placeholder text (~450 words simulated by repetition for CTA insertion logic)
  const baseParagraph = `${origin} to ${destination} taxi service by our brand ensures safe and reliable outstation cab travel with transparent pricing.`;
  const wordCountTarget = 420;
  let words = baseParagraph;
  while(words.split(' ').length < wordCountTarget){ words += ' ' + baseParagraph; }
  const pickupPoints = [`${origin} Railway Station`, `${origin} Airport`];
  const dropPoints = [`${destination} Bus Stand`, `${destination} City Center`];
  const ctas = [ { href: canonicalFare(origin,destination)+'#booking', label: 'Check Fares & Book' } ];
  const updatedDate = await fetchRouteLastUpdated(origin,destination);
  return { props:{ origin,destination,distance:route.distance_km,duration:route.duration_min,fares,faqs:faqs.faqs||[],highlights:hl.highlights||[], intro:words, pickupPoints, dropPoints, words, ctas, routeId: route.id, updatedOn: updatedDate.toISOString() }, revalidate };
};
const BookingIsland = dynamic(()=>import('../../../components/booking/BookingIsland'),{ ssr:false, loading:()=> <div style={{border:'1px solid #ddd',padding:16,borderRadius:6,maxWidth:420}} aria-busy="true">Loading booking…</div>});

export default function RouteSeoPage({ origin,destination,distance,duration,fares,faqs,highlights,intro,pickupPoints,dropPoints,ctas, routeId, inactive, updatedOn }: RouteSeoProps & { inactive?:boolean }){
  const canonical=canonicalSeo(origin,destination);
  const description=metaDescriptionFare(origin,destination,distance,duration);
  const faqLd=faqJsonLd(faqs); const jsonLd = [ faqLd, taxiServiceSchema({ origin, destination, offers: fares.map(f=>({ name:f.car_type, priceInr:f.base })) }) ].filter(Boolean);
  const reverse = alternateForReverseRoute(origin,destination);
  const alternates = [{ href: reverse.content, hrefLang:'en' }];
  if(process.env.ENABLE_HI_LOCALE==='1'){
    try { const pathName = new URL(canonical).pathname; alternates.push({ href: SITE_BASE_URL + routePath('hi', pathName), hrefLang:'hi-IN' }); } catch {}
  }
  const variant = titleVariantForRoute(origin,destination);
  const contentTitle = variant==='priceFirst' ? `${origin} to ${destination} Taxi - Affordable Fares | ${SITE_BRAND}` : `${origin} to ${destination} Taxi Service`;
  // Insert CTA every ~120 words for demo (real requirement 400-600 words) since placeholder duplicated
  const words=intro.split(' ');
  const blocks: string[]=[]; let acc: string[]=[]; const WORDS_PER_BLOCK=120; words.forEach((w)=>{ acc.push(w); if(acc.length>=WORDS_PER_BLOCK){ blocks.push(acc.join(' ')); acc=[]; }}); if(acc.length) blocks.push(acc.join(' '));
  return <Layout><main role="main" style={{lineHeight:1.5}}>
  <HeadSeo title={contentTitle} description={description} canonical={canonical} robots={inactive? 'noindex,follow':'index,follow'} alternates={alternates}>
      <JsonLd data={jsonLd} />
    </HeadSeo>
    <nav aria-label="Breadcrumb" style={{fontSize:12,marginBottom:8}}>
      <ol style={{listStyle:'none',padding:0,margin:0,display:'flex',gap:4,flexWrap:'wrap'}}>
        <li><a href="/">Home</a> /</li>
        <li><a href={`/city/${origin}`}>{origin}</a> /</li>
        <li aria-current="page"><strong>{origin} → {destination} Taxi Guide</strong></li>
      </ol>
    </nav>
  <h1>{origin} to {destination} Taxi Guide</h1>
  <p style={{color:'#555'}}>{distance} km • ~{duration} mins • Door to door</p>
  <p style={{fontSize:12,marginTop:4,color:'#555'}}>{translate('updated_on')} {new Date(updatedOn).toLocaleDateString(undefined,{ day:'numeric', month:'long', year:'numeric' })}</p>
    <section aria-labelledby="fareSummaryHeading" style={{marginTop:16}}>
      <h2 id="fareSummaryHeading">Fare Summary</h2>
      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>{fares.map(f=> <FareCard key={f.car_type} carType={f.car_type} baseFare={f.base} distanceKm={distance} durationMin={duration} />)}</div>
      <p style={{fontSize:12,marginTop:8}}>Detailed fare breakdown & booking available on the <a href={canonicalFare(origin,destination)}>fare page</a>.</p>
    </section>
    <section aria-labelledby="introHeading" style={{marginTop:32}}>
      <h2 id="introHeading">About the {origin} to {destination} Route</h2>
      {blocks.map((b,i)=>{
        const injectCta = (i+1)% (Math.ceil(500/WORDS_PER_BLOCK))===0 && i<blocks.length-1;
        return <p key={i}>{b} {injectCta && <a href={ctas[0].href} className="cta">{ctas[0].label}</a>}</p>;
      })}
      <style jsx>{`.cta{background:#064;color:#fff;padding:2px 6px;border-radius:4px;text-decoration:none;margin-left:4px;font-size:12px}`}</style>
    </section>
    <section aria-labelledby="pickupHeading" style={{marginTop:32}}>
      <h2 id="pickupHeading">Pickup Points in {origin}</h2>
      <ul>{pickupPoints.map(p=><li key={p}>{p}</li>)}</ul>
      <h3>Drop Points in {destination}</h3>
      <ul>{dropPoints.map(p=><li key={p}>{p}</li>)}</ul>
    </section>
    {highlights?.length>0 && <section aria-labelledby="whyHeading" style={{marginTop:32}}><h2 id="whyHeading">Why Choose Us</h2><ul>{highlights.map((h,i)=><li key={i}>{h}</li>)}</ul></section>}
    <section id="quickBooking" style={{marginTop:40}}>
      <details>
        <summary style={{cursor:'pointer'}}>Quick Booking Form</summary>
        <div style={{marginTop:16}}>
          <BookingIsland routeId={routeId} preselectedCarType={(fares[0]?.car_type as any)||'HATCHBACK'} defaultOrigin={origin} defaultDestination={destination} onBooked={(id)=>{ console.log('Booked', id); }} />
        </div>
      </details>
    </section>
    <FaqList faqs={faqs} />
    <footer style={{marginTop:60,fontSize:12}} role="contentinfo">
      <p><strong>Canonical:</strong> <a href={canonical}>{canonical}</a></p>
      <p><strong>Fare Page:</strong> <a href={canonicalFare(origin,destination)}>{origin} to {destination} fare</a></p>
    </footer>
  </main></Layout>;
}

// Token mapping: origin->{Origin}, destination->{Destination}, fares->{FareCards}, intro->{IntroContent}, pickupPoints->{PickupPoints}, dropPoints->{DropPoints}, faqs->{FAQs}
