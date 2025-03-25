import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are a helpful AI assistant focused on nonprofit management and fundraising. Provide clear, practical advice on:

• Fundraising and donor relations
• Program development and impact
• Volunteer management
• Grant writing
• Event planning
• Board governance
• Marketing and communications
• Compliance and risk management

Keep responses concise and actionable. Focus on best practices and real-world examples. Be direct and helpful without requiring additional information.`;

export async function POST(request: Request) {
  try {
    // Authentication
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { success: false, message: 'Please sign in to use this feature' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', session.user.id);

    // Parse request body
    const body = await request.json();
    const { prompt } = body;

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
    try {
      const { error: dbError } = await supabase.from('ai_interactions').insert({
        user_id: session.user.id,
        action: 'chat',
        prompt,
        response: responseText,
        context: {},
        created_at: new Date().toISOString(),
      });

      if (dbError) {
        console.error('Error storing AI interaction:', dbError);
      } else {
        console.log('Successfully stored AI interaction');
      }
    } catch (dbError) {
      console.error('Error storing AI interaction:', dbError);
    }

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