import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { setupAutomationTables } from '@/app/lib/db/setup';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await setupAutomationTables();

    return NextResponse.json({ message: 'Database setup completed successfully' });
  } catch (error) {
    console.error('Error in setup route:', error);
    return NextResponse.json(
      { error: 'Failed to set up database' },
      { status: 500 }
    );
  }
} 