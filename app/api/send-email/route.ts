import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/mail';

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
    const { to, subject, content, recipientName, senderEmail } = await request.json();

    if (!to || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user's email settings
    const { data: emailSettings, error: settingsError } = await supabase
      .from('user_email_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('sender_email', senderEmail)
      .single();

    if (settingsError || !emailSettings) {
      return NextResponse.json(
        { error: 'Email settings not found' },
        { status: 404 }
      );
    }

    // Set SendGrid API key from user settings
    if (!emailSettings.sendgrid_api_key) {
      return NextResponse.json(
        { error: 'SendGrid API key not configured' },
        { status: 400 }
      );
    }

    sgMail.setApiKey(emailSettings.sendgrid_api_key);

    // Prepare email data
    const msg: MailDataRequired = {
      to,
      from: {
        email: emailSettings.sender_email,
        name: emailSettings.sender_name
      },
      replyTo: emailSettings.reply_to_email || emailSettings.sender_email,
      subject,
      html: content,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: true }
      },
      customArgs: {
        user_id: session.user.id,
        template_id: emailSettings.id
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
          sendgrid_message_id: messageId,
          sender_email: emailSettings.sender_email,
          sender_name: emailSettings.sender_name,
          organization_name: emailSettings.organization_name
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
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 