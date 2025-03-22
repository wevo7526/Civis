import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { to, subject, content, recipientName } = await request.json();

    if (!to || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare email data
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com',
      subject,
      html: content,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: true }
      }
    };

    // Send email
    await sgMail.send(msg);

    // Log the email send in your database
    const { error: logError } = await supabase
      .from('email_logs')
      .insert([
        {
          user_id: session.user.id,
          recipient_email: to,
          recipient_name: recipientName,
          subject,
          content,
          status: 'sent',
          sent_at: new Date().toISOString()
        }
      ]);

    if (logError) {
      console.error('Error logging email:', logError);
      // Don't throw here, as the email was sent successfully
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 