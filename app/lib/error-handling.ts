import { Session } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export function requireAuth(session: Session | null): Session['user'] {
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  return session.user;
}

export function validateInput(data: any, validators: Record<string, (value: any) => boolean>): void {
  for (const [key, validator] of Object.entries(validators)) {
    if (!validator(data[key])) {
      throw new Error(`Invalid input for ${key}`);
    }
  }
}

export function handleError(error: unknown): NextResponse {
  console.error('Error:', error);
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Internal server error' },
    { status: 500 }
  );
} 