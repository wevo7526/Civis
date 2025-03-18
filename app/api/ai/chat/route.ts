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
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, documents } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Create a context from the documents
    const documentContext = documents && documents.length > 0
      ? `Context from uploaded documents:\n\n${documents.map((doc: Document) => `Document ${doc.id}:\n${doc.content}`).join('\n\n')}\n\nUser question: ${message}`
      : `User question: ${message}`;

    // Get response from Claude
    const aiResponse = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
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

    if (!aiResponse || !aiResponse.content || !aiResponse.content[0]) {
      throw new Error('Invalid response from AI service');
    }

    const responseText = aiResponse.content[0].type === 'text' 
      ? aiResponse.content[0].text 
      : 'Failed to generate response';

    // Store the interaction in Supabase
    try {
      await supabase.from('ai_interactions').insert({
        user_id: user.id,
        action: 'chat',
        prompt: documentContext,
        response: responseText,
        context: {
          documents: documents?.map((doc: Document) => doc.id) || [],
        },
        created_at: new Date().toISOString(),
      });
    } catch (dbError) {
      console.error('Error storing AI interaction:', dbError);
    }

    return NextResponse.json({
      message: responseText,
    });
  } catch (error) {
    console.error('AI Chat API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 