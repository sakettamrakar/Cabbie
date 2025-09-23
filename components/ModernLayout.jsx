import React from 'react';
import Head from 'next/head';
import ConsentBanner from './ConsentBanner';
import { SITE_BRAND } from '../lib/seo';
export default function ModernLayout({ children, title = `${SITE_BRAND} – Professional Intercity Taxi Service`, description = `Book reliable intercity taxi service with ${SITE_BRAND}. Transparent pricing and professional drivers across India.`, className = "" }) {
    const showAdminLink = process.env.NODE_ENV !== 'production' || process.env.ADMIN_LINK_ENABLED === 'true';
    return (<>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description}/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="icon" href="/favicon.ico"/>
      </Head>
      
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        {/* Skip to content link for accessibility */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg z-50">
          Skip to main content
        </a>

        {/* Navigation Header */}
        <header className="site-header">
          <div className="container site-header__inner">
            <a href="/" className="site-brand" aria-label={`${SITE_BRAND} home`}>
              <span className="site-brand__mark" aria-hidden="true">RT</span>
              <span className="site-brand__text">{SITE_BRAND}</span>
            </a>

            <nav className="site-nav" aria-label="Primary">
              <a href="/routes" className="site-nav__link">Browse Routes</a>
              <a href="/about" className="site-nav__link">About</a>
              <a href="/contact" className="site-nav__link">Support</a>
              {showAdminLink ? (<a href="/admin/bookings" className="site-nav__link">Admin</a>) : null}
              <a href="/book" className="cta cta--sm">Book Now</a>
            </nav>

            <button type="button" className="site-header__menu" aria-label="Toggle navigation menu">
              <svg className="icon-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round"/>
                <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round"/>
                <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className={`flex-1 ${className}`}>
          {children}
        </main>

        {/* Footer */}
        <footer className="site-footer">
          <div className="container site-footer__container">
            <div className="site-footer__brand">
              <a href="/" className="site-brand" aria-label={`${SITE_BRAND} home`}>
                <span className="site-brand__mark" aria-hidden="true">RT</span>
                <span className="site-brand__text">{SITE_BRAND}</span>
              </a>
              <p className="muted">
                Professional intercity taxi service connecting cities with reliable drivers,
                transparent pricing, and instant booking.
              </p>
            </div>

            <div className="site-footer__links">
              <div>
                <h3>Services</h3>
                <ul>
                  <li><a href="/routes">Intercity Rides</a></li>
                  <li><a href="/airport">Airport Transfers</a></li>
                  <li><a href="/outstation">Outstation Travel</a></li>
                  <li><a href="/rental">Car Rental</a></li>
                </ul>
              </div>
              <div>
                <h3>Support</h3>
                <ul>
                  <li><a href="/help">Help Centre</a></li>
                  <li><a href="/contact">Contact</a></li>
                  <li><a href="/privacy">Privacy Policy</a></li>
                  <li><a href="/terms">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="site-footer__bottom">
            <p>&copy; {new Date().getFullYear()} {SITE_BRAND}. All rights reserved.</p>
          </div>
        </footer>

        {/* Consent Banner */}
        <ConsentBanner />
      </div>
    </>);
}
