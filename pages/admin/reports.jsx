import AdminLayout from '../../components/AdminLayout';
import { useEffect, useState } from 'react';
export default function AdminReports() {
    const [data, setData] = useState([]);
    const [top, setTop] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    async function load() {
        setLoading(true);
        setError(null);
        try {
            const r = await fetch('/api/admin/reports');
            const j = await r.json();
            if (!j.ok)
                throw new Error(j.error || 'Failed');
            setData(j.routes);
            setTop(j.top5);
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => { load(); }, []);
    return <AdminLayout title="Reports">
    {error && <p style={{ color: 'crimson' }}>{error}</p>}
    {loading ? <p>Loading...</p> : <>
      <h2 style={{ marginTop: 0 }}>Top 5 Routes by Revenue</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
          <thead><tr style={{ background: '#f1f5f9' }}>
            <th style={th}>Route</th>
            <th style={th}>Revenue ₹</th>
            <th style={th}>Bookings</th>
          </tr></thead>
          <tbody>
            {top.map(r => <tr key={r.route_id}>
              <td style={td}>{r.origin} → {r.destination}</td>
              <td style={td}>{r.totalRevenue}</td>
              <td style={td}>{r.totalBookings}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <h2>All Routes</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f1f5f9' }}>
            <th style={th}>Route</th>
            <th style={th}>Bookings</th>
            <th style={th}>Revenue ₹</th>
            <th style={th}>COD</th>
            <th style={th}>Online</th>
          </tr></thead>
          <tbody>
            {data.map(r => <tr key={r.route_id}>
              <td style={td}>{r.origin} → {r.destination}</td>
              <td style={td}>{r.totalBookings}</td>
              <td style={td}>{r.totalRevenue}</td>
              <td style={td}>{r.codBookings}</td>
              <td style={td}>{r.onlineBookings}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </>}
  </AdminLayout>;
}
const th = { textAlign: 'left', padding: '8px 10px', fontWeight: 500, fontSize: 13, borderBottom: '1px solid #e2e8f0' };
const td = { padding: '6px 10px', fontSize: 13, borderBottom: '1px solid #f1f5f9' };
