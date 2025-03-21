/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize webpack caching
  webpack: (config, { dev, isServer }) => {
    // Optimize cache serialization
    config.cache = {
      type: 'memory',
      maxGenerations: 1,
    };

    return config;
  },

  // Additional security configurations
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  images: {
    domains: ['*.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },

  // Add security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.stripe.com;",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig 