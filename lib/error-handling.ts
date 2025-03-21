import { NextResponse } from 'next/server';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown) {
  console.error('Error:', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      },
      { status: error.statusCode }
    );
  }

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message: string };
    return NextResponse.json(
      {
        error: supabaseError.message,
        code: supabaseError.code,
      },
      { status: 400 }
    );
  }

  // Handle validation errors
  if (error && typeof error === 'object' && 'errors' in error) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 400 }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    },
    { status: 500 }
  );
}

export function validateInput(data: any, schema: Record<string, (value: any) => boolean>) {
  const errors: Record<string, string> = {};

  for (const [key, validator] of Object.entries(schema)) {
    if (!validator(data[key])) {
      errors[key] = `Invalid ${key}`;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors);
  }

  return true;
}

export function requireAuth(session: any) {
  if (!session?.user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  return session.user;
}

export function requireRole(user: any, role: string) {
  if (!user?.role || user.role !== role) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }
  return true;
} 