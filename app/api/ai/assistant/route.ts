import { NextResponse } from 'next/server';
import { ChatAnthropic } from '@langchain/anthropic';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { handleError, requireAuth, validateInput } from '@/lib/error-handling';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: Message[];
  context?: {
    currentPage?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

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
    const user = requireAuth(session);

    const body = await request.json() as RequestBody;
    
    // Validate input
    validateInput(body, {
      messages: (value) => Array.isArray(value) && value.length > 0,
      context: (value) => typeof value === 'object' || value === undefined,
    });

    const { messages, context } = body;

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map((msg: Message) => ({
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

    // Log the interaction
    await supabase.from('ai_interactions').insert({
      user_id: user.id,
      action: 'assistant',
      prompt: messages[messages.length - 1].content,
      response: response.content,
      context: context || {},
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      message: response.content,
    });
  } catch (error) {
    return handleError(error);
  }
} 