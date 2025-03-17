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

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, prompt, context } = await request.json();

    if (!type || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Construct the system message based on document type
    let systemMessage = '';
    if (type === 'grant') {
      systemMessage = `You are an expert grant writer. Generate a complete and professional grant proposal based on the user's prompt and context. 
      The proposal should include:
      - Executive Summary
      - Organization Background
      - Project Description
      - Goals and Objectives
      - Methodology
      - Timeline
      - Budget
      - Impact and Evaluation
      - Sustainability Plan
      
      Make the content detailed, persuasive, and well-structured.`;
    } else {
      systemMessage = `You are an expert fundraising strategist. Generate a comprehensive fundraising strategy based on the user's prompt and context.
      The strategy should include:
      - Current Situation Analysis
      - Fundraising Goals
      - Target Donor Segments
      - Fundraising Methods
      - Timeline
      - Budget
      - Success Metrics
      - Implementation Plan
      
      Make the content strategic, actionable, and well-organized.`;
    }

    // Add project context if available
    if (context?.project) {
      systemMessage += `\n\nProject Context:
      Name: ${context.project.name}
      Description: ${context.project.description}
      Budget: ${context.project.budget}
      Status: ${context.project.status}`;
    }

    // Add document context if available
    if (context?.document) {
      systemMessage += `\n\nDocument Context:
      Title: ${context.document.title}
      Status: ${context.document.status}`;
    }

    const response = await model.invoke(prompt);
    if (!response || !response.content) {
      throw new Error('No content was generated');
    }

    return NextResponse.json({ content: response.content });
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
} 