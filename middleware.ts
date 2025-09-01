import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIX = '/admin';
const LOGIN_PATH = '/admin/login';

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
    // Simple token presence check - actual JWT verification happens in API routes
    // due to Edge Runtime limitations with crypto module
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
