import { NextResponse } from 'next/server';
import { ChatAnthropic } from '@langchain/anthropic';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const model = new ChatAnthropic({
  modelName: 'claude-3-opus-20240229',
  temperature: 0.7,
  maxTokens: 4000,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an AI assistant for a nonprofit management platform. You help users with:
1. Writing and content creation
2. Project management
3. Donor relations
4. Stakeholder engagement
5. Data analysis and insights

Provide helpful, specific, and actionable responses. Be concise but thorough.
Consider the user's current page and context when providing responses.`;

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // Add context to the system message
    const systemMessage = `${SYSTEM_PROMPT}\n\nCurrent page: ${context?.currentPage || 'unknown'}\nTimestamp: ${context?.timestamp || new Date().toISOString()}`;

    // Generate response using Claude
    const response = await model.invoke([
      { role: 'system', content: systemMessage },
      ...anthropicMessages,
    ]);

    if (!response || !response.content) {
      throw new Error('No response content received from Claude');
    }

    return NextResponse.json({
      message: response.content,
    });
  } catch (error) {
    console.error('AI Assistant Error:', error);
    
    // Handle specific Anthropic errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service configuration error' },
          { status: 500 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
} 