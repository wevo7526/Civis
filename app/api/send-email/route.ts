import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/mail';

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

if (!SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set');
}

if (!SENDGRID_FROM_EMAIL) {
  throw new Error('SENDGRID_FROM_EMAIL is not set');
}

sgMail.setApiKey(SENDGRID_API_KEY);

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
    const msg: MailDataRequired = {
      to,
      from: { email: SENDGRID_FROM_EMAIL as string },
      subject,
      html: content,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: true }
      }
    };

    // Send email
    const response = await sgMail.send(msg);
    
    if (!response || response[0]?.statusCode !== 202) {
      throw new Error('Failed to send email via SendGrid');
    }

    const messageId = response[0]?.headers['x-message-id'];

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
          sent_at: new Date().toISOString(),
          sendgrid_message_id: messageId
        }
      ]);

    if (logError) {
      console.error('Error logging email:', logError);
      // Don't throw here, as the email was sent successfully
    }

    return NextResponse.json({ 
      success: true,
      messageId
    });
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 