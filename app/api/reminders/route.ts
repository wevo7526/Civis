import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reminderId } = await request.json();

    // Fetch reminder details
    const { data: reminder, error: reminderError } = await supabase
      .from('reminders')
      .select('*')
      .eq('id', reminderId)
      .single();

    if (reminderError || !reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    // Check if reminder is due
    const now = new Date();
    const dueDate = new Date(reminder.due_date);
    if (now < dueDate) {
      return NextResponse.json(
        { message: 'Reminder not yet due' },
        { status: 200 }
      );
    }

    // Check if max reminders reached
    if (reminder.reminder_count >= reminder.max_reminders) {
      await supabase
        .from('reminders')
        .update({ status: 'cancelled' })
        .eq('id', reminderId);
      return NextResponse.json(
        { message: 'Max reminders reached' },
        { status: 200 }
      );
    }

    // Create in-app notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: `Reminder: ${reminder.title}`,
      message: reminder.description,
      type: 'reminder',
      priority: reminder.priority,
      metadata: {
        reminder_id: reminderId,
        due_date: reminder.due_date,
        category: reminder.category,
      },
    });

    // Update reminder status
    const nextReminderDate = calculateNextReminderDate(
      reminder.due_date,
      reminder.reminder_frequency
    );

    await supabase
      .from('reminders')
      .update({
        reminder_count: reminder.reminder_count + 1,
        notification_sent: true,
        due_date: nextReminderDate,
      })
      .eq('id', reminderId);

    // Log notification
    await supabase.from('reminder_notifications').insert({
      reminder_id: reminderId,
      sent_at: new Date().toISOString(),
      notification_type: 'in-app',
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateNextReminderDate(
  currentDate: string,
  frequency: 'once' | 'daily' | 'weekly' | 'monthly'
): string {
  const date = new Date(currentDate);
  const now = new Date();

  switch (frequency) {
    case 'once':
      return currentDate;
    case 'daily':
      date.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(now.getMonth() + 1);
      break;
  }

  return date.toISOString();
} 