import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminAuth, requireCsrf } from '../../../../lib/adminAuth';
// Stub: would integrate with SMS provider
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  const auth = requireAdminAuth(req,res); if(!auth) return;
  if(req.method!=='POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
  if(!requireCsrf(req,res)) return;
  const { booking_id } = req.body||{};
  if(!booking_id) return res.status(400).json({ ok:false, error:'booking_id required' });
  // Simulate async send
  await new Promise(r=>setTimeout(r,150));
  return res.json({ ok:true, message:'Confirmation SMS resent (stub)' });
}
