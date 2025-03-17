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

  // If user is signed in, check onboarding status
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .single();

    // If onboarding is completed, allow access to all routes
    if (profile?.onboarding_completed) {
      return res;
    }

    // If onboarding is not completed, only allow access to onboarding and its API
    // Also allow access to dashboard if explicitly skipping onboarding
    if (!profile?.onboarding_completed && 
        !['/onboarding', '/api/ai/onboarding', '/dashboard'].includes(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
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
  ],
}; 