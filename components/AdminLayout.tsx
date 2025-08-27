import HeadSeo from './HeadSeo';
import { SITE_BRAND, SITE_BASE_URL } from '../lib/seo';
import React from 'react';
import { adminFetch } from '../lib/adminFetch';

interface AdminLayoutProps { title?: string; children: React.ReactNode; description?: string; }

const NAV = [
  { label:'Routes', href:'/admin/routes' },
  { label:'Fares', href:'/admin/fares' },
  { label:'Offers', href:'/admin/offers' },
  { label:'Drivers', href:'/admin/drivers' },
  { label:'Bookings', href:'/admin/bookings' },
  { label:'Reports', href:'/admin/reports' }
];

export default function AdminLayout({ title='Admin', description='Admin dashboard', children }: AdminLayoutProps){
  return (
    <div className="admin-shell" style={{display:'grid',gridTemplateColumns:'240px 1fr',minHeight:'100vh',gridTemplateRows:'auto 1fr'}}>
      <HeadSeo title={`${title} | ${SITE_BRAND}`} description={description} canonical={`${SITE_BASE_URL}/admin`} />
      <aside style={{background:'#0f172a',color:'#fff',padding:'16px 12px'}}>
        <div style={{fontWeight:600,fontSize:18,marginBottom:24}}>{SITE_BRAND}</div>
        <nav aria-label="Admin navigation">
          <ul style={{listStyle:'none',padding:0,margin:0,display:'grid',gap:4}}>
            {NAV.map(item => <li key={item.href}><a href={item.href} style={{display:'block',padding:'8px 10px',borderRadius:4,textDecoration:'none',color:'#f1f5f9'}}>{item.label}</a></li>)}
          </ul>
        </nav>
      </aside>
      <div style={{display:'grid',gridTemplateRows:'56px 1fr',minHeight:'100%'}}>
        <header style={{background:'#1e293b',color:'#fff',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px'}}>
          <h1 style={{fontSize:18,margin:0,fontWeight:500}}>{title}</h1>
          <button onClick={async()=>{ try { await adminFetch('/api/admin/logout',{method:'POST'}); window.location.href='/admin/login'; } catch(e){ console.error(e);} }} style={{background:'#334155',color:'#fff',border:'1px solid #475569',padding:'6px 14px',borderRadius:4,cursor:'pointer'}}>Logout</button>
        </header>
        <main style={{padding:24,background:'#f8fafc'}}>
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:8,padding:24,minHeight:400}}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
