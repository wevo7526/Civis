import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isValidOrigin, isSuspiciousUserAgent } from '@/lib/security';
import { securityLogger } from '@/lib/logging';

// Security headers
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://api.stripe.com;",
};

export async function middleware(req: NextRequest) {
  // Block requests with x-middleware-subrequest header
  if (req.headers.has('x-middleware-subrequest')) {
    securityLogger.logSuspiciousActivity(req, 'middleware_subrequest_attempt', {
      headers: Object.fromEntries(req.headers.entries()),
    });
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 403 }
    );
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();

  // Log API access
  securityLogger.logApiAccess(
    req,
    req.nextUrl.pathname,
    200,
    session?.user?.id
  );

  // Check origin
  if (!isValidOrigin(req)) {
    securityLogger.logSuspiciousActivity(req, 'invalid_origin', {
      origin: req.headers.get('origin'),
    });
    return new NextResponse(
      JSON.stringify({ error: 'Invalid origin' }),
      { status: 403 }
    );
  }

  // Set CORS headers
  const origin = req.headers.get('origin');
  if (origin) {
    res.headers.set('Access-Control-Allow-Origin', origin);
  }
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  // Apply rate limiting based on endpoint
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                req.headers.get('x-real-ip') || 
                '127.0.0.1';

    // Check rate limit in Supabase
    const { data: rateLimit, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('ip', ip)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Rate limit check error:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500 }
      );
    }

    const now = Date.now();
    const windowSize = 10 * 1000; // 10 seconds
    const maxRequests = 10;

    if (rateLimit) {
      // Update existing rate limit
      if (now - rateLimit.timestamp > windowSize) {
        // Reset if window has passed
        const { error: updateError } = await supabase
          .from('rate_limits')
          .update({ count: 1, timestamp: now })
          .eq('ip', ip);

        if (updateError) {
          console.error('Rate limit update error:', updateError);
          return new NextResponse(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500 }
          );
        }
      } else if (rateLimit.count >= maxRequests) {
        // Rate limit exceeded
        securityLogger.logRateLimitExceeded(req, '/api', maxRequests, 0);
        return new NextResponse(
          JSON.stringify({ 
            error: 'Too many requests',
            limit: maxRequests,
            reset: rateLimit.timestamp + windowSize,
            remaining: 0
          }),
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': (rateLimit.timestamp + windowSize).toString(),
            }
          }
        );
      } else {
        // Increment counter
        const { error: updateError } = await supabase
          .from('rate_limits')
          .update({ count: rateLimit.count + 1 })
          .eq('ip', ip);

        if (updateError) {
          console.error('Rate limit update error:', updateError);
          return new NextResponse(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500 }
          );
        }
      }
    } else {
      // Create new rate limit entry
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({ ip, count: 1, timestamp: now });

      if (insertError) {
        console.error('Rate limit insert error:', insertError);
        return new NextResponse(
          JSON.stringify({ error: 'Internal server error' }),
          { status: 500 }
        );
      }
    }
  }

  return res;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/auth/:path*',
  ],
}; 