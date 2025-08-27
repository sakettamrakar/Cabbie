import AdminLayout from '../../components/AdminLayout';
import { useEffect, useState } from 'react';
import { adminFetch } from '../../lib/adminFetch';

interface Offer { id:number; code:string; discount_type:string; value:number; cap_inr:number|null; valid_from:string|null; valid_to:string|null; active:boolean; conditions:string|null; title:string|null; description:string|null; }

export default function AdminOffers(){
  const [offers,setOffers]=useState<Offer[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [form,setForm]=useState<{id?:number;code:string;discount_type:'FLAT'|'PCT';value:string;cap_inr:string;valid_from:string;valid_to:string;active:boolean;conditions:string;title:string;description:string}>({code:'',discount_type:'FLAT',value:'',cap_inr:'',valid_from:'',valid_to:'',active:true,conditions:'',title:'',description:''});
  const editing = form.id!==undefined;

  async function load(){
    setLoading(true); setError(null);
    try{ const r=await fetch('/api/admin/offers'); const j=await r.json(); if(!j.ok) throw new Error(j.error||'Fetch failed'); setOffers(j.offers);}catch(e:any){setError(e.message);} finally{ setLoading(false);} }
  useEffect(()=>{ load(); },[]);

  function startEdit(o:Offer){ setForm({ id:o.id, code:o.code, discount_type:o.discount_type as any, value:o.value.toString(), cap_inr:o.cap_inr?.toString()||'', valid_from:o.valid_from? o.valid_from.substring(0,10):'', valid_to:o.valid_to? o.valid_to.substring(0,10):'', active:o.active, conditions:o.conditions? o.conditions:'', title:o.title||'', description:o.description||'' }); }
  function reset(){ setForm({code:'',discount_type:'FLAT',value:'',cap_inr:'',valid_from:'',valid_to:'',active:true,conditions:'',title:'',description:''}); }

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!form.code || !form.value) return;
    const payload:any={ code:form.code.toUpperCase(), discount_type:form.discount_type, value:Number(form.value), cap_inr: form.cap_inr? Number(form.cap_inr): null, valid_from: form.valid_from||null, valid_to: form.valid_to||null, active: form.active, conditions: form.conditions? safeJson(form.conditions): null, title: form.title||null, description: form.description||null };
    const url = editing? `/api/admin/offers/${form.id}` : '/api/admin/offers';
    const method = editing? 'PUT':'POST';
  const r = await adminFetch(url,{method,body:JSON.stringify(payload)});
    const j = await r.json();
    if(!j.ok){ alert(j.error||'Save failed'); return; }
    await load();
    reset();
  }

  async function del(id:number){ if(!confirm('Delete offer?')) return; const r=await adminFetch(`/api/admin/offers/${id}`,{method:'DELETE'}); const j=await r.json(); if(!j.ok) alert(j.error||'Delete failed'); else load(); }

  return <AdminLayout title="Offers">
    {error && <p style={{color:'crimson'}}>{error}</p>}
    {loading? <p>Loading...</p> : <>
      <h2 style={{marginTop:0}}>Offers</h2>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#f1f5f9'}}>
              <th style={th}>Code</th>
              <th style={th}>Type</th>
              <th style={th}>Value</th>
              <th style={th}>Cap</th>
              <th style={th}>Valid From</th>
              <th style={th}>Valid To</th>
              <th style={th}>Active</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map(o=> <tr key={o.id}>
              <td style={td}>{o.code}</td>
              <td style={td}>{o.discount_type}</td>
              <td style={td}>{o.value}</td>
              <td style={td}>{o.cap_inr??'—'}</td>
              <td style={td}>{o.valid_from? new Date(o.valid_from).toLocaleDateString():'—'}</td>
              <td style={td}>{o.valid_to? new Date(o.valid_to).toLocaleDateString():'—'}</td>
              <td style={td}>{o.active? '✓':'✗'}</td>
              <td style={td}><button onClick={()=>startEdit(o)} style={{marginRight:6}}>Edit</button><button onClick={()=>del(o.id)} style={{color:'crimson'}}>Delete</button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <h3 style={{marginTop:32}}>{editing? 'Edit Offer':'Create Offer'}</h3>
      <form onSubmit={submit} style={{display:'grid',gap:12,maxWidth:720}}>
        <div style={{display:'flex',gap:12}}>
          <label style={{flex:1}}>Code
            <input value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} required disabled={editing} />
          </label>
          <label style={{flex:1}}>Type
            <select value={form.discount_type} onChange={e=>setForm(f=>({...f,discount_type:e.target.value as any}))}>
              <option value="FLAT">FLAT</option>
              <option value="PCT">PCT</option>
            </select>
          </label>
          <label style={{flex:1}}>Value
            <input type="number" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))} required />
          </label>
          <label style={{flex:1}}>Cap (optional)
            <input type="number" value={form.cap_inr} onChange={e=>setForm(f=>({...f,cap_inr:e.target.value}))} />
          </label>
        </div>
        <div style={{display:'flex',gap:12}}>
          <label style={{flex:1}}>Valid From
            <input type="date" value={form.valid_from} onChange={e=>setForm(f=>({...f,valid_from:e.target.value}))} />
          </label>
          <label style={{flex:1}}>Valid To
            <input type="date" value={form.valid_to} onChange={e=>setForm(f=>({...f,valid_to:e.target.value}))} />
          </label>
          <label style={{display:'flex',alignItems:'center',gap:6}}>
            <input type="checkbox" checked={form.active} onChange={e=>setForm(f=>({...f,active:e.target.checked}))} /> Active
          </label>
        </div>
        <label>Title
          <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
        </label>
        <label>Description
          <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} />
        </label>
        <label>Conditions (JSON)
          <textarea value={form.conditions} onChange={e=>setForm(f=>({...f,conditions:e.target.value}))} rows={3} placeholder='{"city":"raipur"}' />
        </label>
        <div style={{display:'flex',gap:12}}>
          <button type="submit">{editing? 'Update':'Create'}</button>
          {editing && <button type="button" onClick={()=>reset()}>Cancel</button>}
        </div>
      </form>
    </>}
  </AdminLayout>;
}

function safeJson(str:string){ try { return JSON.parse(str); } catch { return null; } }

const th:React.CSSProperties={textAlign:'left',padding:'8px 10px',fontWeight:500,fontSize:13,borderBottom:'1px solid #e2e8f0'};
const td:React.CSSProperties={padding:'6px 10px',fontSize:13,borderBottom:'1px solid #f1f5f9'};
