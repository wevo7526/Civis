import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { messages, system } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return NextResponse.json(
          { error: 'Each message must have a role and content' },
          { status: 400 }
        );
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const stream = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        stream: true,
        max_tokens: 4096,
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        system: system || `You are an AI assistant specialized in nonprofit management and fundraising.
        Provide both conversational responses and structured data when appropriate.
        Format structured data as JSON within <json> tags.
        Each structured data block should include:
        - type: 'analysis' | 'recommendations' | 'insights' | 'metrics'
        - title: A descriptive title
        - content: The actual data
        Keep responses clear, concise, and actionable.`,
        temperature: 0.7,
      }, { signal: controller.signal });

      clearTimeout(timeout);

      // Create a ReadableStream to handle the response
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              if (chunk.type === 'content_block_delta' && 'text' in chunk.delta) {
                controller.enqueue(`data: ${JSON.stringify({ content: chunk.delta.text })}\n\n`);
              }
            }
            controller.enqueue('data: [DONE]\n\n');
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out' },
          { status: 504 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Streaming API Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid API configuration' },
          { status: 500 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to process streaming request',
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 