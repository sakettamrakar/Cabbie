import { GetStaticPaths, GetStaticProps } from 'next';
import HeadSeo from '../../components/HeadSeo';
import RouteCard from '../../components/RouteCard';
// Explicit .ts extension for Windows path edge case in dynamic route
import { cityTopRoutes } from '../../lib/links';
import Layout from '../../components/Layout';
import { fetchCities, fetchCityOutbound, disconnect } from '../../lib/data';
import { canonicalCity, SITE_BASE_URL } from '../../lib/seo';
import { breadcrumbSchema, collectionPageSchema } from '../../lib/schema';

export const revalidate = 86400;
interface CityHubProps { city:string; outbound:{ destination:{ slug:string }; distance_km:number; fares:any[] }[]; }
export const getStaticPaths: GetStaticPaths = async ()=>{
  const cities=await fetchCities();
  const paths=cities.map((c:any)=>({ params:{ city:c.slug }}));
  await disconnect();
  return { paths, fallback:'blocking' };
};
export const getStaticProps: GetStaticProps<CityHubProps & { inactive?:boolean }> = async ({ params })=>{
  const city=params?.city as string;
  const allCities = await fetchCities();
  const cityRec = allCities.find(c=>c.slug===city);
  const routes=await cityTopRoutes(city, 12);
  await disconnect();
  const outbound = routes.map((r:any)=>({ destination:{ slug:r.destination }, distance_km:r.distance_km, fares:r.fares.map((f:any)=>({ car_type:f.car_type, base_fare_inr:f.base_fare_inr })) }));
  return { props:{ city, outbound, inactive: cityRec ? !cityRec.is_active : true }, revalidate };
};
export default function CityHub({ city, outbound, inactive }: CityHubProps & { inactive?:boolean }){
  const canonical=canonicalCity(city);
  const description=`Outbound taxi routes from ${city} with transparent fares.`;
  const top=outbound.slice(0,12);
  const routesUrls = top.map(r=> `${SITE_BASE_URL}/${city}/${r.destination.slug}/fare`);
  const jsonLd=[collectionPageSchema({ name:`Routes from ${city}`, itemUrls: routesUrls }), breadcrumbSchema([ { name:'Home', url: SITE_BASE_URL+'/' }, { name:`Cabs from ${city}`, url: canonical } ])];
  return <Layout><main role="main">
  <HeadSeo title={`Cabs from ${city}`} description={description} canonical={canonical} robots={inactive? 'noindex,follow':'index,follow'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}} />
    </HeadSeo>
  <h1>Cabs from {city}</h1>
    <section aria-labelledby="topRoutesHeading">
      <h2 id="topRoutesHeading">Top Routes</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
        {top.map(r=>{
          const fareOrder=['HATCHBACK','SEDAN','SUV'];
          const sorted=fareOrder.map(t=> r.fares.find((f:any)=>f.car_type===t)?.base_fare_inr).filter(Boolean);
          return <div key={r.destination.slug} style={{display:'flex',flexDirection:'column',gap:4}}>
            <RouteCard origin={city} destination={r.destination.slug} distanceKm={r.distance_km} fareSummary={sorted.join('/')} />
            <div style={{display:'flex',gap:8,fontSize:12}}>
              <a href={`/${city}/${r.destination.slug}/fare`}>Fare</a>
              <a href={`/seo/${city}/${r.destination.slug}`}>Guide</a>
            </div>
          </div>;
        })}
      </div>
    </section>
  </main></Layout>;
}
