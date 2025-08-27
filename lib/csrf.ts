import crypto from 'crypto';

// Double submit cookie approach: store secret|hmac in cookie, provide raw token in header/body

const CSRF_SECRET = process.env.CSRF_SECRET || 'dev_csrf_secret_change_me';

export function getCsrfToken(){
  const raw = crypto.randomBytes(16).toString('hex');
  const hmac = crypto.createHmac('sha256', CSRF_SECRET).update(raw).digest('hex');
  const cookieValue = `${raw}|${hmac}`; // user never sees this directly (only cookie)
  return { cookieValue, token: raw };
}

export function validateCsrf(provided:string, cookieValue:string){
  const [raw, hmac] = cookieValue.split('|');
  if(!raw || !hmac) return false;
  if(provided !== raw) return false;
  const expected = crypto.createHmac('sha256', CSRF_SECRET).update(raw).digest('hex');
  const a = Buffer.from(hmac, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if(a.length !== b.length) return false; // avoid length leak
  // Node's types can be finicky in some TS setups; Buffer satisfies the runtime contract.
  return (crypto.timingSafeEqual as any)(a, b);
}
