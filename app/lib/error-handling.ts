import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Session } from '@supabase/supabase-js';

export async function requireAuth(session: Session | null) {
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  return session.user;
}

export function validateInput(data: any, validators: Record<string, (value: any) => boolean>) {
  for (const [key, validator] of Object.entries(validators)) {
    if (!(key in data)) {
      throw new Error(`Missing required field: ${key}`);
    }
    if (!validator(data[key])) {
      throw new Error(`Invalid value for field: ${key}`);
    }
  }
  return true;
}

export function handleError(error: unknown) {
  console.error('Error:', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'An unexpected error occurred',
  };
} 