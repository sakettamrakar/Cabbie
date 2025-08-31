import https from 'https';
const MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA4_ID || '';
const API_SECRET = process.env.GA4_API_SECRET || '';
export async function sendServerEvent({ client_id, user_id, name, params = {}, event_id }) {
    if (!MEASUREMENT_ID || !API_SECRET)
        return;
    const body = JSON.stringify({ client_id: client_id || 'server-1', user_id, events: [{ name, params: { engagement_time_msec: 1, ...params }, event_id }] });
    await new Promise((resolve) => {
        const req = https.request(`https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, res => { res.on('data', () => { }); res.on('end', resolve); });
        req.on('error', resolve);
        req.write(body);
        req.end();
    });
}
