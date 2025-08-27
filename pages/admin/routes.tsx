import AdminLayout from '../../components/AdminLayout';
import { useEffect, useState } from 'react';
import { adminFetch } from '../../lib/adminFetch';

interface City { id:number; name:string; slug:string; }
interface RouteRow { id:number; origin_city_id:number; destination_city_id:number; distance_km:number|null; duration_min:number|null; is_active:boolean; origin:City; destination:City; }

export default function AdminRoutes(){
  const [routes,setRoutes]=useState<RouteRow[]>([]);
  const [cities,setCities]=useState<City[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [form,setForm]=useState<{id?:number;origin_city_id:number|'';destination_city_id:number|'';distance_km:string;duration_min:string;is_active:boolean}>({origin_city_id:'',destination_city_id:'',distance_km:'',duration_min:'',is_active:true});
  const editing = form.id !== undefined;

  async function load(){
    setLoading(true); setError(null);
    try {
      const [rRes,cRes] = await Promise.all([
        fetch('/api/admin/routes').then(r=>r.json()),
        fetch('/api/admin/cities').then(r=>r.json())
      ]);
      if(!rRes.ok) throw new Error(rRes.error||'Failed routes');
      if(!cRes.ok) throw new Error(cRes.error||'Failed cities');
      setRoutes(rRes.routes);
      setCities(cRes.cities);
    } catch(e:any){ setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ load(); },[]);

  function resetForm(){ setForm({origin_city_id:'',destination_city_id:'',distance_km:'',duration_min:'',is_active:true}); }

  async function handleSubmit(e:React.FormEvent){
    e.preventDefault();
    if(form.origin_city_id===''||form.destination_city_id==='') return;
    const payload:any={ origin_city_id:Number(form.origin_city_id), destination_city_id:Number(form.destination_city_id), distance_km: form.distance_km? Number(form.distance_km): null, duration_min: form.duration_min? Number(form.duration_min): null, is_active: form.is_active };
    const method = editing? 'PUT':'POST';
    const url = editing? `/api/admin/routes/${form.id}` : '/api/admin/routes';
  const res = await adminFetch(url,{method,body:JSON.stringify(payload)});
    const data = await res.json();
    if(!data.ok){ alert(data.error||'Save failed'); return; }
    await load();
    resetForm();
  }

  async function handleDelete(id:number){
    if(!confirm('Delete route?')) return;
  const res = await adminFetch(`/api/admin/routes/${id}`,{method:'DELETE'});
    const data = await res.json();
    if(!data.ok){ alert(data.error||'Delete failed'); return; }
    await load();
  }

  function startEdit(r:RouteRow){
    setForm({ id:r.id, origin_city_id:r.origin_city_id, destination_city_id:r.destination_city_id, distance_km: r.distance_km?.toString()||'', duration_min: r.duration_min?.toString()||'', is_active:r.is_active });
  }

  return <AdminLayout title="Routes">
    {error && <p style={{color:'crimson'}}>{error}</p>}
    {loading? <p>Loading...</p> : <>
      <h2 style={{marginTop:0}}>Existing Routes</h2>
      <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#f1f5f9'}}>
            <th style={th}>Origin</th>
            <th style={th}>Destination</th>
            <th style={th}>Distance (km)</th>
            <th style={th}>Duration (min)</th>
            <th style={th}>Active</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {routes.map(r=> <tr key={r.id}>
            <td style={td}>{r.origin.name}</td>
            <td style={td}>{r.destination.name}</td>
            <td style={td}>{r.distance_km??'—'}</td>
            <td style={td}>{r.duration_min??'—'}</td>
            <td style={td}>{r.is_active? '✓':'✗'}</td>
            <td style={td}>
              <button onClick={()=>startEdit(r)} style={{marginRight:8}}>Edit</button>
              <button onClick={()=>handleDelete(r.id)} style={{color:'crimson'}}>Delete</button>
            </td>
          </tr>)}
        </tbody>
      </table>
      </div>
      <h2 style={{marginTop:32}}>{editing? 'Edit Route':'Add Route'}</h2>
      <form onSubmit={handleSubmit} style={{display:'grid',gap:12,maxWidth:520}}>
        <div style={{display:'flex',gap:12}}>
          <label style={{flex:1}}>Origin
            <select value={form.origin_city_id} onChange={e=>setForm(f=>({...f,origin_city_id:e.target.value===''?'':Number(e.target.value)}))} required>
              <option value="">Select city</option>
              {cities.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label style={{flex:1}}>Destination
            <select value={form.destination_city_id} onChange={e=>setForm(f=>({...f,destination_city_id:e.target.value===''?'':Number(e.target.value)}))} required>
              <option value="">Select city</option>
              {cities.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <div style={{display:'flex',gap:12}}>
          <label style={{flex:1}}>Distance (km)
            <input type="number" step="0.1" value={form.distance_km} onChange={e=>setForm(f=>({...f,distance_km:e.target.value}))} />
          </label>
          <label style={{flex:1}}>Duration (min)
            <input type="number" value={form.duration_min} onChange={e=>setForm(f=>({...f,duration_min:e.target.value}))} />
          </label>
        </div>
        <label style={{display:'flex',alignItems:'center',gap:8}}>
          <input type="checkbox" checked={form.is_active} onChange={e=>setForm(f=>({...f,is_active:e.target.checked}))} /> Active
        </label>
        <div style={{display:'flex',gap:12}}>
          <button type="submit">{editing? 'Update':'Create'}</button>
          {editing && <button type="button" onClick={()=>resetForm()}>Cancel</button>}
        </div>
      </form>
    </>}
  </AdminLayout>;
}

const th:React.CSSProperties={textAlign:'left',padding:'8px 10px',fontWeight:500,fontSize:13,borderBottom:'1px solid #e2e8f0'};
const td:React.CSSProperties={padding:'6px 10px',fontSize:13,borderBottom:'1px solid #f1f5f9'};
