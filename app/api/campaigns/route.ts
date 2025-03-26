import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxEmails: 1000, // Maximum emails per day per user
  maxCampaigns: 5, // Maximum campaigns per day per user
  batchSize: 50, // Number of emails to send in each batch
  batchDelay: 1000, // Delay between batches in milliseconds
};

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { 
  emailCount: number; 
  campaignCount: number;
  resetTime: number;
}>();

interface EmailRecipient {
  email: string;
}

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
        rateLimitStore.set(session.user.id, { 
          emailCount: 0, 
          campaignCount: 1, 
          resetTime: now + RATE_LIMIT.windowMs 
        });
      } else if (userRateLimit.campaignCount >= RATE_LIMIT.maxCampaigns) {
        return NextResponse.json(
          { error: 'Campaign rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      } else {
        // Increment campaign count
        userRateLimit.campaignCount++;
      }
    } else {
      // Initialize rate limit for new user
      rateLimitStore.set(session.user.id, { 
        emailCount: 0, 
        campaignCount: 1, 
        resetTime: now + RATE_LIMIT.windowMs 
      });
    }

    const { 
      name,
      subject,
      content,
      recipients,
      fromName,
      fromEmail,
      replyTo,
      scheduleTime
    } = await request.json();

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

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert([
        {
          user_id: session.user.id,
          name,
          subject,
          content,
          from_name: fromName || emailSettings.sender_name,
          from_email: fromEmail || emailSettings.sender_email,
          reply_to: replyTo || emailSettings.reply_to_email,
          status: 'pending',
          scheduled_for: scheduleTime,
          total_recipients: recipients.length,
          sent_count: 0,
          failed_count: 0,
        },
      ])
      .select()
      .single();

    if (campaignError) {
      throw campaignError;
    }

    // Process recipients in batches
    const batches = [];
    for (let i = 0; i < recipients.length; i += RATE_LIMIT.batchSize) {
      batches.push(recipients.slice(i, i + RATE_LIMIT.batchSize));
    }

    let successCount = 0;
    let failureCount = 0;

    for (const batch of batches) {
      const batchPromises = batch.map(async (recipient: EmailRecipient) => {
        try {
          // Check email rate limit
          const userLimit = rateLimitStore.get(session.user.id);
          if (userLimit && userLimit.emailCount >= RATE_LIMIT.maxEmails) {
            throw new Error('Email rate limit exceeded');
          }

          const msg = {
            to: recipient.email,
            from: {
              email: campaign.from_email,
              name: campaign.from_name,
            },
            replyTo: campaign.reply_to,
            subject: campaign.subject,
            text: content,
            html: content,
            trackingSettings: {
              clickTracking: { enable: true },
              openTracking: { enable: true },
            },
          };

          await sgMail.send(msg);

          // Update rate limit
          if (userLimit) {
            userLimit.emailCount++;
          }

          // Log successful send
          await supabase.from('campaign_logs').insert([
            {
              campaign_id: campaign.id,
              recipient_email: recipient.email,
              status: 'sent',
              sent_at: new Date().toISOString(),
            },
          ]);

          successCount++;
        } catch (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error);
          
          // Log failed send
          await supabase.from('campaign_logs').insert([
            {
              campaign_id: campaign.id,
              recipient_email: recipient.email,
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              sent_at: new Date().toISOString(),
            },
          ]);

          failureCount++;
        }
      });

      // Wait for current batch to complete
      await Promise.all(batchPromises);
      
      // Add delay between batches
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.batchDelay));
    }

    // Update campaign status
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        status: 'completed',
        sent_count: successCount,
        failed_count: failureCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', campaign.id);

    if (updateError) {
      console.error('Error updating campaign status:', updateError);
    }

    return NextResponse.json({ 
      success: true,
      campaignId: campaign.id,
      stats: {
        total: recipients.length,
        sent: successCount,
        failed: failureCount,
      },
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (campaignsError) {
      throw campaignsError;
    }

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
} 