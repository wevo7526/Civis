import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is not signed in and the current path is not /login or /signup,
  // redirect the user to /login
  if (!session && !['/login', '/signup'].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is signed in and the current path is /login or /signup,
  // redirect the user to /dashboard
  if (session && ['/login', '/signup'].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is signed in and coming from signup, check onboarding status
  if (session) {
    const referer = request.headers.get('referer') || '';
    const isFromSignup = referer.includes('/signup');

    if (isFromSignup) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single();

      // If onboarding is not completed and trying to access protected routes
      // (excluding onboarding and its API), redirect to onboarding
      if (!profile?.onboarding_completed) {
        const protectedRoutes = ['/dashboard', '/projects', '/team', '/settings'];
        if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
          return NextResponse.redirect(new URL('/onboarding', request.url));
        }
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
    '/onboarding',
    '/api/ai/onboarding',
    '/projects/:path*',
    '/team/:path*',
    '/settings/:path*',
  ],
}; 