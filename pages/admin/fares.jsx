import AdminLayout from '../../components/AdminLayout';
import { useEffect, useState } from 'react';
import { adminFetch } from '../../lib/adminFetch';
export default function AdminFares() {
    const [fares, setFares] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editId, setEditId] = useState(null);
    const [editBase, setEditBase] = useState('');
    const [editNight, setEditNight] = useState('');
    const [bulkCar, setBulkCar] = useState('SEDAN');
    const [bulkMode, setBulkMode] = useState('PCT');
    const [bulkValue, setBulkValue] = useState('');
    const [bulkResult, setBulkResult] = useState();
    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/fares');
            const data = await res.json();
            if (!data.ok)
                throw new Error(data.error || 'Failed');
            setFares(data.fares);
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => { load(); }, []);
    function startEdit(row) {
        setEditId(row.id);
        setEditBase(row.base_fare_inr.toString());
        setEditNight(row.night_surcharge_pct.toString());
    }
    function cancelEdit() { setEditId(null); setEditBase(''); setEditNight(''); }
    async function saveEdit() {
        if (editId == null)
            return;
        const res = await adminFetch(`/api/admin/fares/${editId}`, { method: 'PUT', body: JSON.stringify({ base_fare_inr: editBase ? Number(editBase) : undefined, night_surcharge_pct: editNight ? Number(editNight) : undefined }) });
        const data = await res.json();
        if (!data.ok) {
            alert(data.error || 'Update failed');
            return;
        }
        await load();
        cancelEdit();
    }
    async function runBulk(e) {
        e.preventDefault();
        if (!bulkValue)
            return;
        const res = await adminFetch('/api/admin/fares/bulk', { method: 'POST', body: JSON.stringify({ car_type: bulkCar, mode: bulkMode, value: Number(bulkValue) }) });
        const data = await res.json();
        if (!data.ok) {
            setBulkResult(data.error || 'Bulk update failed');
            return;
        }
        setBulkResult(`Updated ${data.updated} fares.`);
        await load();
    }
    return <AdminLayout title="Fares">
    {error && <p style={{ color: 'crimson' }}>{error}</p>}
    {loading ? <p>Loading...</p> : <>
      <h2 style={{ marginTop: 0 }}>Fares</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={th}>Route</th>
              <th style={th}>Car Type</th>
              <th style={th}>Fare ₹</th>
              <th style={th}>Night %</th>
              <th style={th}>Updated</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fares.map(f => {
                const editing = f.id === editId;
                return <tr key={f.id}>
                <td style={td}>{f.route.origin.slug} → {f.route.destination.slug}</td>
                <td style={td}>{f.car_type}</td>
                <td style={td}>{editing ? <input value={editBase} onChange={e => setEditBase(e.target.value)} style={{ width: 80 }}/> : f.base_fare_inr}</td>
                <td style={td}>{editing ? <input value={editNight} onChange={e => setEditNight(e.target.value)} style={{ width: 60 }}/> : f.night_surcharge_pct}</td>
                <td style={td}>{new Date(f.updated_at).toLocaleDateString()}</td>
                <td style={td}>{editing ? <>
                  <button onClick={saveEdit} style={{ marginRight: 6 }}>Save</button>
                  <button onClick={cancelEdit}>Cancel</button>
                </> : <button onClick={() => startEdit(f)}>Edit</button>}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <h3 style={{ marginTop: 32 }}>Bulk Update</h3>
      <form onSubmit={runBulk} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <label>Car Type
          <select value={bulkCar} onChange={e => setBulkCar(e.target.value)}>
            <option>HATCHBACK</option>
            <option>SEDAN</option>
            <option>SUV</option>
          </select>
        </label>
        <label>Mode
          <select value={bulkMode} onChange={e => setBulkMode(e.target.value)}>
            <option value="PCT">% Adjust (e.g. +10 or -5)</option>
            <option value="DELTA">Flat Δ (add rupees)</option>
            <option value="SET">Set Exact</option>
          </select>
        </label>
        <label>Value
          <input value={bulkValue} onChange={e => setBulkValue(e.target.value)} placeholder={bulkMode === 'PCT' ? '+10' : bulkMode === 'DELTA' ? '+50' : '1200'}/>
        </label>
        <button type="submit">Apply</button>
        {bulkResult && <span>{bulkResult}</span>}
      </form>
    </>}
  </AdminLayout>;
}
const th = { textAlign: 'left', padding: '8px 10px', fontWeight: 500, fontSize: 13, borderBottom: '1px solid #e2e8f0' };
const td = { padding: '6px 10px', fontSize: 13, borderBottom: '1px solid #f1f5f9' };
