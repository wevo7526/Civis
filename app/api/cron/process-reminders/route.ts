import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Verify cron job secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Fetch all pending reminders that are due
    const now = new Date().toISOString();
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('status', 'pending')
      .lte('due_date', now);

    if (error) {
      throw error;
    }

    // Process each reminder
    const results = await Promise.allSettled(
      reminders.map(async (reminder) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/reminders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reminderId: reminder.id }),
          });

          if (!response.ok) {
            throw new Error(`Failed to process reminder ${reminder.id}`);
          }

          return { id: reminder.id, status: 'success' };
        } catch (error) {
          console.error(`Error processing reminder ${reminder.id}:`, error);
          return { id: reminder.id, status: 'error', error };
        }
      })
    );

    // Log results
    const successCount = results.filter(
      (result) => result.status === 'fulfilled' && result.value.status === 'success'
    ).length;

    const errorCount = results.length - successCount;

    await supabase.from('cron_logs').insert({
      job_name: 'process_reminders',
      status: errorCount === 0 ? 'success' : 'partial',
      processed_count: successCount,
      error_count: errorCount,
      details: {
        total: results.length,
        success: successCount,
        errors: errorCount,
        results: results.map((result) =>
          result.status === 'fulfilled' ? result.value : result.reason
        ),
      },
    });

    return NextResponse.json({
      success: true,
      processed: successCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error('Error processing reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 