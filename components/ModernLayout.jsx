import React from 'react';
import Head from 'next/head';
import ConsentBanner from './ConsentBanner';
export default function ModernLayout({ children, title = "Cabbie - Professional Intercity Taxi Service", description = "Book reliable intercity taxi service with transparent pricing and professional drivers.", className = "" }) {
    return (<>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description}/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="icon" href="/favicon.ico"/>
        <link rel="stylesheet" href="/styles/unified-design.css"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
      </Head>
      
      <div style={{ minHeight: '100vh', background: 'var(--neutral-50)', display: 'flex', flexDirection: 'column' }}>
        {/* Skip to content link for accessibility */}
        <a href="#main-content" className="sr-only focus:not-sr-only" 
           style={{ position: 'absolute', top: 'var(--space-4)', left: 'var(--space-4)', zIndex: 50 }}>
          Skip to main content
        </a>

        {/* Navigation Header */}
        <header style={{ 
          background: 'white', 
          boxShadow: 'var(--shadow-sm)', 
          borderBottom: '1px solid var(--neutral-200)', 
          position: 'sticky', 
          top: 0, 
          zIndex: 40 
        }}>
          <div className="container">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              height: '64px',
              padding: '0 var(--space-4)'
            }}>
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <a href="/" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-3)', 
                  color: 'var(--primary-600)',
                  textDecoration: 'none'
                }}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                    color: 'white',
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-xl)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--font-bold)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    C
                  </div>
                  <span style={{ 
                    fontSize: 'var(--text-2xl)', 
                    fontWeight: 'var(--font-bold)',
                    letterSpacing: '-0.025em'
                  }}>Cabbie</span>
                </a>
              </div>

              {/* Navigation */}
              <nav className="nav" style={{ display: 'none' }}>
                <a href="/routes" className="nav-item">
                  Browse Routes
                </a>
                <a href="/about" className="nav-item">
                  About Us
                </a>
                <a href="/contact" className="nav-item">
                  Contact
                </a>
                <a href="/book" className="btn btn-primary btn-sm">
                  Book Now
                </a>
              </nav>
              <nav className="md:flex hidden nav">
                <a href="/routes" className="nav-item">
                  Browse Routes
                </a>
                <a href="/about" className="nav-item">
                  About Us
                </a>
                <a href="/contact" className="nav-item">
                  Contact
                </a>
                <a href="/book" className="btn btn-primary btn-sm">
                  Book Now
                </a>
              </nav>

              {/* Mobile menu button */}
              <div className="md:hidden block">
                <button type="button" className="btn btn-ghost" aria-label="Toggle navigation menu">
                  <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" style={{ flex: 1 }} className={className}>
          {children}
        </main>

        {/* Footer */}
        <footer style={{ 
          background: 'var(--neutral-900)', 
          color: 'white', 
          marginTop: 'auto'
        }}>
          <div className="container py-16">
            <div className="grid md:grid-cols-4 gap-8" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
              {/* Company Info */}
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-3)', 
                  marginBottom: 'var(--space-6)' 
                }}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                    color: 'white',
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-xl)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--font-bold)'
                  }}>
                    C
                  </div>
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)' }}>Cabbie</span>
                </div>
                <p style={{ 
                  color: 'var(--neutral-300)', 
                  marginBottom: 'var(--space-6)', 
                  maxWidth: '28rem',
                  lineHeight: 'var(--leading-relaxed)'
                }}>
                  Professional intercity taxi service connecting cities with reliable drivers, 
                  transparent pricing, and instant booking.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  <a href="https://facebook.com" style={{ 
                    color: 'var(--neutral-400)', 
                    transition: 'color var(--transition-fast)' 
                  }}>
                    <span className="sr-only">Facebook</span>
                    <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd"/>
                    </svg>
                  </a>
                  <a href="https://twitter.com" style={{ 
                    color: 'var(--neutral-400)', 
                    transition: 'color var(--transition-fast)' 
                  }}>
                    <span className="sr-only">Twitter</span>
                    <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Services */}
              <div>
                <h3 style={{ 
                  fontSize: 'var(--text-lg)', 
                  fontWeight: 'var(--font-semibold)', 
                  marginBottom: 'var(--space-4)',
                  color: 'white'
                }}>Services</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: 'var(--space-2)' }}>
                    <a href="/routes" style={{ color: 'var(--neutral-300)', textDecoration: 'none' }}>Intercity Rides</a>
                  </li>
                  <li style={{ marginBottom: 'var(--space-2)' }}>
                    <a href="/airport" style={{ color: 'var(--neutral-300)', textDecoration: 'none' }}>Airport Transfer</a>
                  </li>
                  <li style={{ marginBottom: 'var(--space-2)' }}>
                    <a href="/outstation" style={{ color: 'var(--neutral-300)', textDecoration: 'none' }}>Outstation Travel</a>
                  </li>
                  <li style={{ marginBottom: 'var(--space-2)' }}>
                    <a href="/rental" style={{ color: 'var(--neutral-300)', textDecoration: 'none' }}>Car Rental</a>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 style={{ 
                  fontSize: 'var(--text-lg)', 
                  fontWeight: 'var(--font-semibold)', 
                  marginBottom: 'var(--space-4)',
                  color: 'white'
                }}>Support</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: 'var(--space-2)' }}>
                    <a href="/help" style={{ color: 'var(--neutral-300)', textDecoration: 'none' }}>Help Center</a>
                  </li>
                  <li style={{ marginBottom: 'var(--space-2)' }}>
                    <a href="/contact" style={{ color: 'var(--neutral-300)', textDecoration: 'none' }}>Contact Us</a>
                  </li>
                  <li style={{ marginBottom: 'var(--space-2)' }}>
                    <a href="/privacy" style={{ color: 'var(--neutral-300)', textDecoration: 'none' }}>Privacy Policy</a>
                  </li>
                  <li style={{ marginBottom: 'var(--space-2)' }}>
                    <a href="/terms" style={{ color: 'var(--neutral-300)', textDecoration: 'none' }}>Terms of Service</a>
                  </li>
                </ul>
              </div>
            </div>

            <div style={{ 
              borderTop: '1px solid var(--neutral-700)', 
              marginTop: 'var(--space-8)', 
              paddingTop: 'var(--space-8)', 
              textAlign: 'center',
              color: 'var(--neutral-400)'
            }}>
              <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Cabbie. All rights reserved. Professional intercity taxi service.</p>
            </div>
          </div>
        </footer>

        {/* Consent Banner */}
        <ConsentBanner />
      </div>
    </>);
}
