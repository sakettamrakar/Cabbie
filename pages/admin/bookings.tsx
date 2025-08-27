import AdminLayout from '../../components/AdminLayout';
import { useEffect, useState } from 'react';
import { adminFetch } from '../../lib/adminFetch';

interface Booking { id:number; route:{ origin:{ slug:string }; destination:{ slug:string } }; pickup_datetime:string; car_type:string; customer_phone:string; status:string; assignments:{ driver:{ id:number; name:string } }[] }
interface Driver { id:number; name:string; car_type:string; active:boolean; }

export default function AdminBookings(){
  const [bookings,setBookings]=useState<Booking[]>([]);
  const [drivers,setDrivers]=useState<Driver[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [filters,setFilters]=useState<{id:string;phone:string;date:string;status:string}>({id:'',phone:'',date:'',status:''});

  async function load(){
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k,v])=>{ if(v) params.set(k,v); });
      const [bRes,dRes] = await Promise.all([
        fetch('/api/admin/bookings?'+params.toString()).then(r=>r.json()),
        fetch('/api/admin/drivers').then(r=>r.json())
      ]);
      if(!bRes.ok) throw new Error(bRes.error||'Bookings fetch failed');
      if(!dRes.ok) throw new Error(dRes.error||'Drivers fetch failed');
      setBookings(bRes.bookings);
      setDrivers(dRes.drivers.filter((d:any)=>d.active));
    } catch(e:any){ setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  function applyFilters(e:React.FormEvent){ e.preventDefault(); load(); }
  function resetFilters(){ setFilters({id:'',phone:'',date:'',status:''}); setTimeout(()=>load(),0); }

  async function assignDriver(bookingId:number, driverId:number){
  const res = await adminFetch('/api/admin/bookings/assign',{method:'POST',body:JSON.stringify({ booking_id:bookingId, driver_id:driverId })});
    const j = await res.json();
    if(!j.ok){ alert(j.error||'Assign failed'); return; }
    load();
  }

  async function updateStatus(bookingId:number,status:string){
  const res = await adminFetch('/api/admin/bookings/status',{method:'POST',body:JSON.stringify({ booking_id:bookingId, status })});
    const j = await res.json();
    if(!j.ok){ alert(j.error||'Status update failed'); return; }
    load();
  }

  async function resend(bookingId:number){
  const res = await adminFetch('/api/admin/bookings/resend',{method:'POST',body:JSON.stringify({ booking_id:bookingId })});
    const j = await res.json();
    if(!j.ok) alert(j.error||'Resend failed'); else alert(j.message);
  }

  return <AdminLayout title="Bookings">
    {error && <p style={{color:'crimson'}}>{error}</p>}
    <form onSubmit={applyFilters} style={{display:'flex',flexWrap:'wrap',gap:12,marginBottom:16}}>
      <input placeholder="ID" value={filters.id} onChange={e=>setFilters(f=>({...f,id:e.target.value}))} style={filterInput} />
      <input placeholder="Phone" value={filters.phone} onChange={e=>setFilters(f=>({...f,phone:e.target.value}))} style={filterInput} />
      <input type="date" value={filters.date} onChange={e=>setFilters(f=>({...f,date:e.target.value}))} style={filterInput} />
      <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))} style={filterInput}>
        <option value="">Status</option>
        <option>PENDING</option>
        <option>ASSIGNED</option>
        <option>COMPLETED</option>
        <option>CANCELLED</option>
      </select>
      <button type="submit">Filter</button>
      <button type="button" onClick={resetFilters}>Reset</button>
    </form>
    {loading? <p>Loading...</p> : <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#f1f5f9'}}>
            <th style={th}>ID</th>
            <th style={th}>Route</th>
            <th style={th}>Pickup</th>
            <th style={th}>Car</th>
            <th style={th}>Phone</th>
            <th style={th}>Status</th>
            <th style={th}>Assign Driver</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b=>{
            const assigned = b.assignments[0]?.driver?.name;
            return <tr key={b.id}>
              <td style={td}>{b.id}</td>
              <td style={td}>{b.route?.origin?.slug} → {b.route?.destination?.slug}</td>
              <td style={td}>{new Date(b.pickup_datetime).toLocaleString()}</td>
              <td style={td}>{b.car_type}</td>
              <td style={td}>{b.customer_phone}</td>
              <td style={td}>{b.status}</td>
              <td style={td}>
                {b.status==='COMPLETED'||b.status==='CANCELLED'? '—' : <select defaultValue="" onChange={e=>{ const val=e.target.value; if(val){ assignDriver(b.id, Number(val)); e.target.value=''; }}}>
                  <option value="">{assigned? 'Reassign':'Assign'}</option>
                  {drivers.filter(d=>d.car_type===b.car_type).map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>}
              </td>
              <td style={td}>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {b.status!=='CANCELLED' && b.status!=='COMPLETED' && <button type="button" onClick={()=>updateStatus(b.id,'CANCELLED')} style={{color:'#b00'}}>Cancel</button>}
                  {b.status==='ASSIGNED' && <button type="button" onClick={()=>updateStatus(b.id,'COMPLETED')}>Complete</button>}
                  <button type="button" onClick={()=>resend(b.id)}>Resend SMS</button>
                </div>
              </td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>}
  </AdminLayout>;
}

const th:React.CSSProperties={textAlign:'left',padding:'8px 10px',fontWeight:500,fontSize:13,borderBottom:'1px solid #e2e8f0'};
const td:React.CSSProperties={padding:'6px 10px',fontSize:13,borderBottom:'1px solid #f1f5f9'};
const filterInput:React.CSSProperties={padding:'6px 8px',border:'1px solid #cbd5e1',borderRadius:4,fontSize:13};
