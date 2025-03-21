export function isValidOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  
  // Allow requests with no origin (direct requests)
  if (!origin) {
    return true;
  }

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'https://localhost:3000'
  ].filter(Boolean);

  return allowedOrigins.includes(origin);
}

export function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /phantomjs/i,
    /selenium/i,
    /puppeteer/i
  ];

  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
} 