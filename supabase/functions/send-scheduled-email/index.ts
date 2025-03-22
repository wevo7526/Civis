// @deno-types="https://deno.land/x/types/index.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import sgMail from 'https://esm.sh/@sendgrid/mail@7.7.0'

interface ScheduledEmail {
  id: string;
  template_id: string;
  recipient_id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  content: string;
  scheduled_date: string;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  updated_at: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

// Validate environment variables
const requiredEnvVars = ['SENDGRID_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
for (const envVar of requiredEnvVars) {
  if (!Deno.env.get(envVar)) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

// Initialize clients
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
sgMail.setApiKey(Deno.env.get('SENDGRID_API_KEY')!)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get pending scheduled emails
    const { data: scheduledEmails, error: fetchError } = await supabaseClient
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_date', new Date().toISOString());

    if (fetchError) throw fetchError;

    if (!scheduledEmails || scheduledEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending emails to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process emails in batches
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < scheduledEmails.length; i += batchSize) {
      batches.push(scheduledEmails.slice(i, i + batchSize));
    }

    let successCount = 0;
    let failureCount = 0;

    for (const batch of batches) {
      const batchPromises = batch.map(async (email: ScheduledEmail) => {
        try {
          // Send email
          const msg = {
            to: email.recipient_email,
            from: {
              email: 'your-verified-sender@example.com', // Replace with your verified sender
              name: 'Your Organization Name'
            },
            subject: email.subject,
            html: email.content,
            trackingSettings: {
              clickTracking: { enable: true },
              openTracking: { enable: true },
              subscriptionTracking: { enable: true }
            }
          };

          await sgMail.send(msg);

          // Update email status
          const { error: updateError } = await supabaseClient
            .from('scheduled_emails')
            .update({ 
              status: 'sent',
              updated_at: new Date().toISOString()
            })
            .eq('id', email.id);

          if (updateError) throw updateError;
          successCount++;
        } catch (err) {
          console.error(`Failed to send email ${email.id}:`, err);
          
          // Update email status to failed
          await supabaseClient
            .from('scheduled_emails')
            .update({ 
              status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', email.id);

          failureCount++;
        }
      });

      // Wait for current batch to complete
      await Promise.all(batchPromises);
      // Add delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${scheduledEmails.length} emails: ${successCount} sent, ${failureCount} failed`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing scheduled emails:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 