import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const authRecoveryRoutes = ['/auth/reset-password', '/auth/verify'];
  const isAuthRecoveryRoute = authRecoveryRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Auth routes handling: redirect signed-in users trying to access auth pages back to home
  if (req.nextUrl.pathname.startsWith('/auth')) {
    if (user && !isAuthRecoveryRoute) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return res;
  }

  return res;
}

export const config = {
  matcher: [
    '/auth/:path*'
  ]
}; 
