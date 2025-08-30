export default function handler(req, res) {
    if (req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({ ok: true });
    }
    else {
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ error: 'Method not allowed' });
    }
}
