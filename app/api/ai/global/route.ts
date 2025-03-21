import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

interface AIResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

// Validate environment variables
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not set');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60; // 1 minute in seconds
const MAX_REQUESTS = 30; // Maximum requests per window

async function checkRateLimit(userId: string): Promise<boolean> {
  try {
    const { data: requests, error } = await supabase
      .from('ai_rate_limits')
      .select('count, last_request')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow request if rate limit check fails
    }

    const now = new Date();
    const lastRequest = requests?.last_request ? new Date(requests.last_request) : null;
    const timeDiff = lastRequest ? (now.getTime() - lastRequest.getTime()) / 1000 : RATE_LIMIT_WINDOW;

    if (!lastRequest || timeDiff >= RATE_LIMIT_WINDOW) {
      // Reset counter if window has passed
      await supabase
        .from('ai_rate_limits')
        .upsert({
          user_id: userId,
          count: 1,
          last_request: now.toISOString(),
        });
      return true;
    }

    if (requests.count >= MAX_REQUESTS) {
      return false;
    }

    // Increment counter
    await supabase
      .from('ai_rate_limits')
      .update({
        count: requests.count + 1,
        last_request: now.toISOString(),
      })
      .eq('user_id', userId);

    return true;
  } catch (error) {
    console.error('Rate limit error:', error);
    return true; // Allow request if rate limiting fails
  }
}

const SYSTEM_PROMPT = `You are a helpful AI assistant focused on nonprofit management and fundraising. Provide clear, practical advice on:

• Fundraising and donor relations
• Program development and impact
• Volunteer management
• Grant writing
• Event planning
• Board governance
• Marketing and communications
• Compliance and risk management

Keep responses concise and actionable. Focus on best practices and real-world examples.`;

export async function POST(request: Request) {
  try {
    // Authentication
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Please sign in to use this feature' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitAllowed = await checkRateLimit(session.user.id);
    if (!rateLimitAllowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { prompt, context } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, message: 'Please provide a prompt for the AI assistant.' },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      system: SYSTEM_PROMPT,
      temperature: 0.7,
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Store the interaction in Supabase
    await supabase.from('ai_interactions').insert({
      user_id: session.user.id,
      action: 'chat',
      prompt,
      response: responseText,
      context: context || {},
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      content: response.content,
      data: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
} 