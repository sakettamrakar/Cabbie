import React from 'react';
import Head from 'next/head';
import ConsentBanner from './ConsentBanner';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export default function ModernLayout({ 
  children, 
  title = "Cabbie - Professional Intercity Taxi Service",
  description = "Book reliable intercity taxi service with transparent pricing and professional drivers.",
  className = ""
}: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        {/* Skip to content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg z-50"
        >
          Skip to main content
        </a>

        {/* Navigation Header */}
        <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-40">
          <div className="container">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center">
                <a 
                  href="/" 
                  className="flex items-center space-x-3 text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <div className="bg-primary-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold">
                    C
                  </div>
                  <span className="text-2xl font-bold tracking-tight">Cabbie</span>
                </a>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
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
              <div className="md:hidden">
                <button 
                  type="button"
                  className="btn btn-ghost p-2"
                  aria-label="Toggle navigation menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className={`flex-1 ${className}`}>
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-neutral-800 text-white mt-auto">
          <div className="container py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Company Info */}
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-primary-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold">
                    C
                  </div>
                  <span className="text-xl font-bold">Cabbie</span>
                </div>
                <p className="text-neutral-300 mb-4 max-w-md">
                  Professional intercity taxi service connecting cities with reliable drivers, 
                  transparent pricing, and instant booking.
                </p>
                <div className="flex space-x-4">
                  <a href="https://facebook.com" className="text-neutral-400 hover:text-white transition-colors">
                    <span className="sr-only">Facebook</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="https://twitter.com" className="text-neutral-400 hover:text-white transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Services</h3>
                <ul className="space-y-2 text-neutral-300">
                  <li><a href="/routes" className="hover:text-white transition-colors">Intercity Rides</a></li>
                  <li><a href="/airport" className="hover:text-white transition-colors">Airport Transfer</a></li>
                  <li><a href="/outstation" className="hover:text-white transition-colors">Outstation Travel</a></li>
                  <li><a href="/rental" className="hover:text-white transition-colors">Car Rental</a></li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Support</h3>
                <ul className="space-y-2 text-neutral-300">
                  <li><a href="/help" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-neutral-700 mt-8 pt-8 text-center text-neutral-400">
              <p>&copy; {new Date().getFullYear()} Cabbie. All rights reserved. Professional intercity taxi service.</p>
            </div>
          </div>
        </footer>

        {/* Consent Banner */}
        <ConsentBanner />
      </div>
    </>
  );
}
