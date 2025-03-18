import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

interface Document {
  id: string;
  content: string;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

console.log('Anthropic API Key length:', process.env.ANTHROPIC_API_KEY?.length || 0);
console.log('Anthropic API Key prefix:', process.env.ANTHROPIC_API_KEY?.substring(0, 4) || 'none');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SYSTEM_PROMPT = `You are an AI assistant specialized in analyzing documents and answering questions based on their content. Your role is to:

1. Analyze uploaded documents and create a knowledge matrix
2. Answer questions based on the document content
3. Provide insights and connections between different documents
4. Maintain context throughout the conversation
5. Cite specific parts of documents when relevant

Always provide clear, accurate responses based on the available information. If information is not available in the documents, clearly state that.`;

export async function POST(request: Request) {
  try {
    console.log('Received chat API request');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    console.log('Verifying token with Supabase...');
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { message, documents } = body;

    if (!message) {
      console.error('Missing message in request');
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Create a context from the documents
    const documentContext = documents && documents.length > 0
      ? `Context from uploaded documents:\n\n${documents.map((doc: Document) => `Document ${doc.id}:\n${doc.content}`).join('\n\n')}\n\nUser question: ${message}`
      : `User question: ${message}`;

    console.log('Sending request to Claude...');
    console.log('Document context length:', documentContext.length);
    
    // Get response from Claude
    try {
      const aiResponse = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: documentContext,
          },
        ],
        system: SYSTEM_PROMPT,
        temperature: 0.7,
      });

      console.log('Received response from Claude');
      console.log('AI Response:', JSON.stringify(aiResponse, null, 2));

      if (!aiResponse || !aiResponse.content || !aiResponse.content[0]) {
        console.error('Invalid response from Claude:', aiResponse);
        throw new Error('Invalid response from AI service');
      }

      const responseText = aiResponse.content[0].type === 'text' 
        ? aiResponse.content[0].text 
        : 'Failed to generate response';

      console.log('Storing interaction in Supabase...');
      // Store the interaction in Supabase
      try {
        const { error: dbError } = await supabase.from('ai_interactions').insert({
          user_id: user.id,
          action: 'chat',
          prompt: documentContext,
          response: responseText,
          context: {
            documents: documents?.map((doc: Document) => doc.id) || [],
          },
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
        message: responseText,
      });
    } catch (aiError) {
      console.error('Claude API Error:', {
        error: aiError,
        message: aiError instanceof Error ? aiError.message : 'Unknown error',
        stack: aiError instanceof Error ? aiError.stack : undefined,
        type: aiError instanceof Error ? aiError.constructor.name : typeof aiError,
      });
      throw aiError;
    }
  } catch (error) {
    console.error('AI Chat API Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
} 