export function jsonOk(res, payload) { res.status(200).json({ ok: true, correlation_id: res.correlation_id, ...payload }); }
export function jsonCreated(res, payload) { res.status(201).json({ ok: true, correlation_id: res.correlation_id, ...payload }); }
