import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { SendEmailRequest, SendEmailResponse, SendGridMessage, EmailLog } from '@/types/email';

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: Request) {
  try {
    // Get the session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body: SendEmailRequest = await request.json();
    
    if (!body.to || !body.subject || !body.content || !body.recipientName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get email settings
    const { data: emailSettings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .eq('is_default', true)
      .single();

    if (settingsError || !emailSettings) {
      return NextResponse.json(
        { error: 'No default email settings found' },
        { status: 400 }
      );
    }

    // Prepare email data with proper typing
    const msg: SendGridMessage = {
      to: body.to,
      from: {
        email: emailSettings.sender_email,
        name: emailSettings.sender_name
      },
      replyTo: emailSettings.reply_to_email || emailSettings.sender_email,
      subject: body.subject,
      html: body.content,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: true }
      },
      customArgs: {
        user_id: session.user.id,
        template_id: body.templateId
      }
    };

    // Send email
    const response = await sgMail.send(msg);
    
    if (!response || response[0]?.statusCode !== 202) {
      throw new Error('Failed to send email via SendGrid');
    }

    const messageId = response[0]?.headers['x-message-id'];

    // Log the email send in your database with proper typing
    const emailLog: Omit<EmailLog, 'id'> = {
      user_id: session.user.id,
      recipient_email: body.to,
      recipient_name: body.recipientName,
      subject: body.subject,
      content: body.content,
      status: 'sent',
      sent_at: new Date().toISOString(),
      sendgrid_message_id: messageId,
      sender_email: emailSettings.sender_email,
      sender_name: emailSettings.sender_name,
      organization_name: emailSettings.organization_name
    };

    const { error: logError } = await supabase
      .from('email_logs')
      .insert([emailLog]);

    if (logError) {
      console.error('Error logging email:', logError);
      // Don't throw here, as the email was sent successfully
    }

    const successResponse: SendEmailResponse = {
      success: true,
      messageId
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log the error in the database
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const errorLog: Omit<EmailLog, 'id'> = {
        user_id: session.user.id,
        recipient_email: 'unknown',
        recipient_name: 'unknown',
        subject: 'unknown',
        content: 'unknown',
        status: 'failed',
        sent_at: new Date().toISOString(),
        sender_email: 'unknown',
        sender_name: 'unknown',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      };

      await supabase
        .from('email_logs')
        .insert([errorLog]);
    }

    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      },
      { status: 500 }
    );
  }
} 