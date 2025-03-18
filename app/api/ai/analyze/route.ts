import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { VectorStore } from '@/app/lib/vectorStore';

interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    title: string;
    documentId: string;
    type: string;
  };
  similarity: number;
}

// Initialize Anthropic client
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not set');
}
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize Supabase client
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are not set');
}
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const SYSTEM_PROMPT = `You are an expert nonprofit management AI assistant specializing in document analysis. Your role is to:

1. Analyze documents thoroughly and provide structured insights
2. Focus on nonprofit management, fundraising, and organizational effectiveness
3. Provide actionable recommendations based on the content
4. Maintain a professional and analytical tone
5. Structure your response in a clear, organized manner

When analyzing documents:
- Consider both explicit and implicit information
- Look for patterns and connections
- Provide specific examples from the text
- Focus on practical implications
- Highlight both strengths and areas for improvement

Always respond with a valid JSON object containing:
{
  "keyFindings": [
    {
      "category": "string",
      "findings": ["string"]
    }
  ],
  "insights": [
    {
      "category": "string",
      "insights": ["string"]
    }
  ],
  "recommendations": [
    {
      "recommendation": "string",
      "rationale": "string",
      "priority": "high" | "medium" | "low"
    }
  ]
}`;

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query, documents } = body;

    if (!query || !documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'Query and documents are required' },
        { status: 400 }
      );
    }

    // Store documents in vector store
    const vectorStore = new VectorStore();
    console.log('Storing documents in vector store...');
    console.log('Number of documents:', documents.length);
    
    for (const doc of documents) {
      console.log('Processing document:', doc.title);
      try {
        await vectorStore.storeDocument(doc);
        console.log('Successfully stored document:', doc.title);
      } catch (error) {
        console.error('Error storing document:', doc.title, error);
        throw error;
      }
    }

    // Search for relevant document chunks
    console.log('Searching for relevant chunks...');
    console.log('Query:', query);
    
    const relevantChunks = await vectorStore.searchSimilar(query);
    console.log('Search results:', relevantChunks);
    
    if (!relevantChunks || relevantChunks.length === 0) {
      console.log('No relevant chunks found, proceeding with full document analysis');
      // Instead of returning an error, we'll analyze the full document
      const fullDocument = documents[0];
      const documentContext = `Document: ${fullDocument.title}
Type: ${fullDocument.type}
Content:
${fullDocument.content}`;

      // Get structured analysis from Claude
      console.log('Getting analysis from Claude...');
      const aiResponse = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Please analyze the following document and provide insights in the required JSON format.

Query: ${query}

Document to analyze:
${documentContext}

Instructions:
1. Analyze the document content thoroughly
2. Provide specific, actionable insights based on the document content
3. Focus on nonprofit management and fundraising aspects
4. Ensure all findings are directly supported by the document content
5. Structure your response in a clear, organized manner

Remember to respond ONLY with a valid JSON object in the specified format.`,
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

      console.log('Raw AI response:', responseText);

      // Parse the structured response
      let structuredResponse;
      try {
        // Try to find JSON in the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No JSON found in response. Raw response:', responseText);
          throw new Error('No JSON object found in response');
        }
        structuredResponse = JSON.parse(jsonMatch[0]);
      } catch (error) {
        console.error('Failed to parse AI response:', error);
        console.error('Raw response:', responseText);
        throw new Error('Failed to parse AI response');
      }

      // Validate the response structure
      if (!structuredResponse.keyFindings || !structuredResponse.insights || !structuredResponse.recommendations) {
        console.error('Invalid response structure:', structuredResponse);
        throw new Error('Invalid response structure');
      }

      // Store the interaction in Supabase
      console.log('Storing interaction in Supabase...');
      const { error: interactionError } = await supabase.from('ai_interactions').insert({
        user_id: user.id,
        action: 'document_analysis',
        prompt: query,
        response: responseText,
        context: {
          documents: documents.map((doc: any) => doc.id),
          analysis_type: 'full_document',
        },
        created_at: new Date().toISOString(),
      });

      if (interactionError) {
        console.error('Error storing interaction:', interactionError);
      }

      return NextResponse.json({
        ...structuredResponse,
        relevantDocuments: [{
          title: fullDocument.title,
          content: fullDocument.content,
          similarity: 1.0,
        }],
      });
    }

    // Create a more structured context from relevant chunks
    const documentContext = relevantChunks
      .map((chunk: DocumentChunk, index: number) => {
        const similarity = (chunk.similarity * 100).toFixed(2);
        return `Document ${index + 1}: ${chunk.metadata.title}
Relevance: ${similarity}%
Content:
${chunk.content}
---`;
      })
      .join('\n\n');

    // Get structured analysis from Claude
    console.log('Getting analysis from Claude...');
    const aiResponse = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Please analyze the following documents and provide insights in the required JSON format.

Query: ${query}

Documents to analyze (with relevance scores):
${documentContext}

Instructions:
1. Analyze each document's content thoroughly
2. Consider the relevance scores when weighing the importance of each document
3. Provide specific, actionable insights based on the document content
4. Focus on nonprofit management and fundraising aspects
5. Ensure all findings are directly supported by the document content

Remember to respond ONLY with a valid JSON object in the specified format.`,
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

    console.log('Raw AI response:', responseText);

    // Parse the structured response
    let structuredResponse;
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response. Raw response:', responseText);
        throw new Error('No JSON object found in response');
      }
      structuredResponse = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Raw response:', responseText);
      throw new Error('Failed to parse AI response');
    }

    // Validate the response structure
    if (!structuredResponse.keyFindings || !structuredResponse.insights || !structuredResponse.recommendations) {
      console.error('Invalid response structure:', structuredResponse);
      throw new Error('Invalid response structure');
    }

    // Store the interaction in Supabase
    console.log('Storing interaction in Supabase...');
    const { error: interactionError } = await supabase.from('ai_interactions').insert({
      user_id: user.id,
      action: 'document_analysis',
      prompt: query,
      response: responseText,
      context: {
        documents: documents.map((doc: any) => doc.id),
        relevant_chunks: relevantChunks.map((chunk: DocumentChunk) => chunk.id),
      },
      created_at: new Date().toISOString(),
    });

    if (interactionError) {
      console.error('Error storing interaction:', interactionError);
      // Don't throw here, as we still want to return the analysis
    }

    return NextResponse.json({
      ...structuredResponse,
      relevantDocuments: relevantChunks.map((chunk: DocumentChunk) => ({
        title: chunk.metadata.title,
        content: chunk.content,
        similarity: chunk.similarity,
      })),
    });
  } catch (error) {
    console.error('Document Analysis API Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to analyze documents',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
} 