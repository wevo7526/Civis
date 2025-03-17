import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    const { messages, context } = await request.json();

    // Add context to the system message
    const systemMessage = {
      role: 'system',
      content: `${SYSTEM_PROMPT}\n\nCurrent page: ${context.currentPage}\nTimestamp: ${context.timestamp}`,
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      message: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('AI Assistant Error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
} 