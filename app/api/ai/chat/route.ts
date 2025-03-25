import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Anthropic } from '@anthropic-ai/sdk';
import { ChatMessage, ChatConfig } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { prompt, config } = await request.json() as { prompt: string; config?: ChatConfig };

    const systemPrompt = `You are an AI assistant specialized in nonprofit management and fundraising. 
    You have expertise in:
    - Fundraising strategies and donor management
    - Grant writing and grant management
    - Volunteer coordination and engagement
    - Program development and evaluation
    - Community outreach and stakeholder management
    - Nonprofit operations and compliance
    - Impact measurement and reporting
    - Strategic planning and organizational development

    Provide clear, actionable advice and insights based on best practices in the nonprofit sector. 
    Focus on practical solutions and evidence-based approaches.`;

    const message = await anthropic.messages.create({
      model: config?.model || 'claude-3-opus-20240229',
      max_tokens: config?.maxTokens || 2000,
      temperature: config?.temperature || 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    // Save the chat message to the database
    const { error: saveError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: session.user.id,
        role: 'assistant',
        content: message.content[0].type === 'text' ? message.content[0].text : '',
        timestamp: new Date().toISOString(),
      });

    if (saveError) {
      console.error('Error saving chat message:', saveError);
    }

    return NextResponse.json({
      success: true,
      content: message.content,
      data: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({
      success: false,
      content: [{
        type: 'text' as const,
        text: error instanceof Error ? error.message : 'Unknown error occurred'
      }],
      data: {
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore
    });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: history } = await supabase
      .from('chat_messages')
      .select('content, role, timestamp')
      .eq('user_id', session.user.id)
      .order('timestamp', { ascending: true });

    return NextResponse.json({
      success: true,
      messages: history || [],
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 