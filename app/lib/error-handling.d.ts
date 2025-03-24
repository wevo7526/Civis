import { Session } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export function requireAuth(session: Session | null): Session['user'];
export function validateInput(data: any, validators: Record<string, (value: any) => boolean>): void;
export function handleError(error: unknown): NextResponse; 