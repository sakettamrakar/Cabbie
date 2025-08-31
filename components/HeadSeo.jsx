import Head from 'next/head';
import { buildTitle } from '../lib/seo';
// Standardized SEO head: always emits robots (default index,follow)
export const HeadSeo = ({ title, description, canonical, robots = 'index,follow', alternates = [], children }) => (<Head>
    <title>{buildTitle(title)}</title>
    <meta name="description" content={description}/>
    <link rel="canonical" href={canonical}/>
    <meta name="robots" content={robots}/>
  {alternates.map(a => <link key={a.href + (a.hrefLang || '')} rel="alternate" href={a.href} hrefLang={a.hrefLang || 'en'}/>)}
    {children}
  </Head>);
export default HeadSeo;
