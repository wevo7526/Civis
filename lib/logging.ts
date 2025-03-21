interface LogEntry {
  timestamp: string;
  level: 'info' | 'error';
  event: string;
  details: Record<string, any>;
  ip: string;
}

class SecurityLogger {
  private log(entry: LogEntry) {
    console.log(JSON.stringify(entry));
  }

  logApiAccess(req: Request, endpoint: string, statusCode: number, userId?: string) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                req.headers.get('x-real-ip') || 
                '127.0.0.1';

    this.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'api_access',
      details: {
        endpoint,
        statusCode,
        userId
      },
      ip
    });
  }

  logSuspiciousActivity(req: Request, activity: string, details: Record<string, any> = {}) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                req.headers.get('x-real-ip') || 
                '127.0.0.1';

    this.log({
      timestamp: new Date().toISOString(),
      level: 'error',
      event: 'suspicious_activity',
      details: {
        activity,
        ...details
      },
      ip
    });
  }

  logRateLimitExceeded(req: Request, endpoint: string, limit: number, remaining: number) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                req.headers.get('x-real-ip') || 
                '127.0.0.1';

    this.log({
      timestamp: new Date().toISOString(),
      level: 'error',
      event: 'rate_limit_exceeded',
      details: {
        endpoint,
        limit,
        remaining
      },
      ip
    });
  }
}

export const securityLogger = new SecurityLogger(); 