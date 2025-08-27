import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminAuth, requireCsrf } from '../../../lib/adminAuth';
export default function handler(req:NextApiRequest,res:NextApiResponse){
  const auth = requireAdminAuth(req,res); if(!auth) return;
  if(req.method !== 'POST') return res.status(405).json({ok:false,error:'Method not allowed'});
  if(!requireCsrf(req,res)) return;
  res.setHeader('Set-Cookie','admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  return res.json({ok:true});
}
