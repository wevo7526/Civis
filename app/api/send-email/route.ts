import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/mail';

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxEmails: 1000, // Maximum emails per day per user
};

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    const now = Date.now();
    const userRateLimit = rateLimitStore.get(session.user.id);

    if (userRateLimit) {
      if (now > userRateLimit.resetTime) {
        // Reset rate limit if window has passed
        rateLimitStore.set(session.user.id, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
      } else if (userRateLimit.count >= RATE_LIMIT.maxEmails) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      } else {
        // Increment count
        userRateLimit.count++;
      }
    } else {
      // Initialize rate limit for new user
      rateLimitStore.set(session.user.id, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    }

    const { to, subject, content, recipientName } = await request.json();

    // Get user's email settings
    const { data: emailSettings } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_default', true)
      .single();

    if (!emailSettings) {
      return NextResponse.json(
        { error: 'No default email settings found' },
        { status: 400 }
      );
    }

    // Prepare email
    const msg = {
      to,
      from: {
        email: emailSettings.sender_email,
        name: emailSettings.sender_name,
      },
      replyTo: emailSettings.reply_to_email,
      subject,
      text: content,
      html: content,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
    };

    // Send email
    await sgMail.send(msg);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 