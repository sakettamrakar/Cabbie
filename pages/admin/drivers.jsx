import AdminLayout from '../../components/AdminLayout';
import { useEffect, useState } from 'react';
import { adminFetch } from '../../lib/adminFetch';
export default function AdminDrivers() {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({ name: '', phone: '', car_type: 'SEDAN', vehicle_no: '', active: true });
    const editing = form.id !== undefined;
    async function load() {
        setLoading(true);
        setError(null);
        try {
            const r = await fetch('/api/admin/drivers');
            const j = await r.json();
            if (!j.ok)
                throw new Error(j.error || 'Fetch failed');
            setDrivers(j.drivers);
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => { load(); }, []);
    function startEdit(d) { setForm({ id: d.id, name: d.name, phone: d.phone, car_type: d.car_type, vehicle_no: d.vehicle_no || '', active: d.active }); }
    function reset() { setForm({ name: '', phone: '', car_type: 'SEDAN', vehicle_no: '', active: true }); }
    async function submit(e) {
        e.preventDefault();
        if (!form.name || !form.phone)
            return;
        const payload = { name: form.name, phone: form.phone, car_type: form.car_type, vehicle_no: form.vehicle_no || null, active: form.active };
        const url = editing ? `/api/admin/drivers/${form.id}` : '/api/admin/drivers';
        const method = editing ? 'PUT' : 'POST';
        const r = await adminFetch(url, { method, body: JSON.stringify(payload) });
        const j = await r.json();
        if (!j.ok) {
            alert(j.error || 'Save failed');
            return;
        }
        await load();
        reset();
    }
    async function del(id) { if (!confirm('Delete driver?'))
        return; const r = await adminFetch(`/api/admin/drivers/${id}`, { method: 'DELETE' }); const j = await r.json(); if (!j.ok)
        alert(j.error || 'Delete failed');
    else
        load(); }
    return <AdminLayout title="Drivers">
    {error && <p style={{ color: 'crimson' }}>{error}</p>}
    {loading ? <p>Loading...</p> : <>
      <h2 style={{ marginTop: 0 }}>Drivers</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={th}>Name</th>
              <th style={th}>Phone</th>
              <th style={th}>Car Type</th>
              <th style={th}>Vehicle No.</th>
              <th style={th}>Active</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(d => <tr key={d.id}>
              <td style={td}>{d.name}</td>
              <td style={td}>{d.phone}</td>
              <td style={td}>{d.car_type}</td>
              <td style={td}>{d.vehicle_no || '—'}</td>
              <td style={td}>{d.active ? '✓' : '✗'}</td>
              <td style={td}><button onClick={() => startEdit(d)} style={{ marginRight: 6 }}>Edit</button><button onClick={() => del(d.id)} style={{ color: 'crimson' }}>Delete</button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <h3 style={{ marginTop: 32 }}>{editing ? 'Edit Driver' : 'Add Driver'}</h3>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 640 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ flex: 1 }}>Name
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required/>
          </label>
          <label style={{ flex: 1 }}>Phone
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required/>
          </label>
          <label style={{ flex: 1 }}>Car Type
            <select value={form.car_type} onChange={e => setForm(f => ({ ...f, car_type: e.target.value }))}>
              <option>HATCHBACK</option>
              <option>SEDAN</option>
              <option>SUV</option>
            </select>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ flex: 1 }}>Vehicle Number
            <input value={form.vehicle_no} onChange={e => setForm(f => ({ ...f, vehicle_no: e.target.value }))} placeholder="e.g. CG04 AB 1234"/>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}/> Active
          </label>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit">{editing ? 'Update' : 'Create'}</button>
          {editing && <button type="button" onClick={() => reset()}>Cancel</button>}
        </div>
      </form>
    </>}
  </AdminLayout>;
}
const th = { textAlign: 'left', padding: '8px 10px', fontWeight: 500, fontSize: 13, borderBottom: '1px solid #e2e8f0' };
const td = { padding: '6px 10px', fontSize: 13, borderBottom: '1px solid #f1f5f9' };
