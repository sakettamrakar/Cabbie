import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const PROTECTED_PREFIX = '/admin';
const LOGIN_PATH = '/admin/login';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev_admin_secret_change_me';

export function middleware(req:NextRequest){
  const { pathname } = req.nextUrl;
  if(pathname.startsWith(PROTECTED_PREFIX) && pathname !== LOGIN_PATH){
    const token = req.cookies.get('admin_session')?.value;
    if(!token){
      const url = req.nextUrl.clone();
      url.pathname = LOGIN_PATH;
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    try {
      const decoded:any = jwt.verify(token, JWT_SECRET);
      // Refresh sliding session if exp < 10m left
      const now = Math.floor(Date.now()/1000);
      if(decoded.exp && decoded.exp - now < 600){
        const newExp = now + 60*30;
        const newToken = jwt.sign({ sub:decoded.sub, email:decoded.email, exp:newExp }, JWT_SECRET);
        const res = NextResponse.next();
        res.cookies.set('admin_session', newToken, { httpOnly:true, path:'/', maxAge:60*30, sameSite:'lax' });
        return res;
      }
    } catch {
      const url = req.nextUrl.clone();
      url.pathname = LOGIN_PATH;
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
