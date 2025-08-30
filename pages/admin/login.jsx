import { useState } from 'react';
import HeadSeo from '../../components/HeadSeo';
import Layout from '../../components/Layout';
import { SITE_BASE_URL } from '../../lib/seo';
export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            const data = await res.json();
            if (!data.ok) {
                setError(data.error || 'Login failed');
            }
            else {
                if (data.csrfToken) {
                    try {
                        sessionStorage.setItem('csrfToken', data.csrfToken);
                    }
                    catch { }
                }
                window.location.href = '/admin';
            }
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }
    return <Layout><main>
    <HeadSeo title="Admin Login" description="Secure admin login" canonical={`${SITE_BASE_URL}/admin/login`}/>
    <h1>Admin Login</h1>
    {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, display: 'grid', gap: 12 }}>
      <label>Email
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username"/>
      </label>
      <label>Password
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"/>
      </label>
      <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
    </form>
  </main></Layout>;
}
