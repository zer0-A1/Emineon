import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const bypass = process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === '1';
  if (!bypass) return NextResponse.next();

  const url = new URL(req.url);
  const res = NextResponse.next();

  // Ensure a deterministic dev user cookie exists for the app to treat as signed-in
  if (!req.cookies.get('dev-user-id')) {
    res.cookies.set('dev-user-id', 'test-user-playwright', { path: '/' });
  }

  // If the app tries to send us to sign-in, keep the user in the app
  if (url.pathname.startsWith('/sign-in') || url.pathname.startsWith('/signin') || url.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next|static|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map)).*)'],
};


