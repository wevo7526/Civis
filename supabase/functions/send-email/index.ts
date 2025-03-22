import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import sgMail from 'https://esm.sh/@sendgrid/mail@7.7.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize SendGrid with API key
    sgMail.setApiKey(Deno.env.get('SENDGRID_API_KEY') || '')

    // Get the request body
    const { to, subject, content, from, recipientName } = await req.json()

    // Validate required fields
    if (!to || !subject || !content || !from) {
      throw new Error('Missing required fields')
    }

    // Prepare email data
    const msg = {
      to,
      from: {
        email: from,
        name: 'Your Organization Name' // You can make this dynamic
      },
      subject,
      html: content,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: true }
      }
    }

    // Send email
    await sgMail.send(msg)

    // Store email record in the database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    await supabaseClient
      .from('email_history')
      .insert({
        to_email: to,
        subject,
        content,
        from_email: from,
        recipient_name: recipientName,
        status: 'sent',
        sent_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 