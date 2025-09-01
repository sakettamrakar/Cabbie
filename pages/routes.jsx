import HeadSeo from '../components/HeadSeo';
import { fetchRoutes, disconnect } from '../lib/data';
import { canonicalRoutesIndex, SITE_BASE_URL } from '../lib/seo';
import { collectionPageSchema } from '../lib/schema';
import Layout from '../components/Layout';
export const revalidate = 86400;
export const getStaticProps = async () => {
    const routes = await fetchRoutes();
    await disconnect();
    return { props: { routes: routes.map((r) => ({ id: r.id, origin: r.origin.slug, destination: r.destination.slug, distance: r.distance_km })) }, revalidate };
};
export default function RoutesIndex({ routes }) {
    const canonical = canonicalRoutesIndex();
    const description = 'All intercity taxi routes with fixed fares.';
    const grouped = routes.slice().sort((a, b) => (a.origin + a.destination).localeCompare(b.origin + b.destination));
    const routeUrls = grouped.map(r => `${SITE_BASE_URL}/${r.origin}/${r.destination}/fare`);
    return <Layout><main role="main">
    <HeadSeo title='All Routes' description={description} canonical={canonical} robots="index,follow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([collectionPageSchema({ name: 'All Routes', itemUrls: routeUrls })]) }}/>
    </HeadSeo>
  <h1>All Routes</h1>
    <ul>
      {grouped.map(r => <li key={r.id}><a href={`/${r.origin}/${r.destination}/fare`}>{r.origin} → {r.destination}</a> ({r.distance} km)</li>)}
    </ul>
  </main></Layout>;
}
