import { SITE_BRAND } from '../lib/seo';
import ConsentBanner from './ConsentBanner';
export default function Layout({ children }) {
    return (<div className="appShell">
      <a href="#main" className="skip">Skip to content</a>
      <header className="siteHeader" role="banner">
        <div className="inner">
          <a className="brand" href="/" aria-label={`${SITE_BRAND} home`}>{SITE_BRAND}</a>
          <nav aria-label="Primary" className="primaryNav">
            <a href="/routes">Routes</a>
          </nav>
        </div>
      </header>
  <div id="main" className="content" role="main">{children}</div>
  <ConsentBanner />
      <footer className="siteFooter" role="contentinfo">
        <p>&copy; {new Date().getFullYear()} {SITE_BRAND}. Intercity Taxi Service.</p>
      </footer>
    </div>);
}
