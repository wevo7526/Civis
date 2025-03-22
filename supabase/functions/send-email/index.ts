/// <reference lib="deno.ns" />
/// <reference lib="deno.window" />

// @deno-types="https://deno.land/x/types/index.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import sgMail from 'https://esm.sh/@sendgrid/mail@7.7.0'

interface EmailRequest {
  to: string;
  subject: string;
  content: string;
  from: string;
  recipientName?: string;
}

interface CustomError extends Error {
  message: string;
}

interface Request {
  method: string;
  json(): Promise<EmailRequest>;
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

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Get and validate request body
    const body: EmailRequest = await req.json()
    
    // Validate required fields with specific error messages
    const missingFields = []
    if (!body.to) missingFields.push('to')
    if (!body.subject) missingFields.push('subject')
    if (!body.content) missingFields.push('content')
    if (!body.from) missingFields.push('from')

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.to) || !emailRegex.test(body.from)) {
      throw new Error('Invalid email format')
    }

    // Prepare email data
    const msg = {
      to: body.to,
      from: {
        email: body.from,
        name: 'Your Organization Name'
      },
      subject: body.subject,
      html: body.content,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: true }
      }
    }

    // Send email
    await sgMail.send(msg)

    // Store email record in the database
    const { error: dbError } = await supabaseClient
      .from('email_history')
      .insert({
        to_email: body.to,
        subject: body.subject,
        content: body.content,
        from_email: body.from,
        recipient_name: body.recipientName || null,
        status: 'sent',
        sent_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to store email record')
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        } 
      }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    
    const customError = error as CustomError
    
    // Determine appropriate status code
    const statusCode = customError.message.includes('Method not allowed') ? 405 :
                      customError.message.includes('Missing required fields') ? 400 :
                      customError.message.includes('Invalid email format') ? 400 : 500

    return new Response(
      JSON.stringify({ 
        error: customError.message,
        status: 'error'
      }),
      { 
        status: statusCode,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    )
  }
}) 