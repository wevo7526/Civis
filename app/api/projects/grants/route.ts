import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are an expert grant writer with deep knowledge of nonprofit fundraising and grant writing best practices. Your role is to help organizations create compelling, well-structured grant proposals that effectively communicate their mission, impact, and funding needs.

Key Grant Writing Principles:
1. Clarity and Conciseness
   - Write clear, direct language
   - Avoid jargon unless necessary
   - Use active voice
   - Be specific and concrete

2. Structure and Organization
   - Follow a logical flow
   - Use clear section headings
   - Include proper transitions
   - Maintain consistent formatting

3. Impact and Outcomes
   - Focus on measurable outcomes
   - Use data and statistics when available
   - Demonstrate clear need
   - Show sustainability

4. Budget and Resources
   - Provide detailed budget breakdowns
   - Justify all expenses
   - Show cost-effectiveness
   - Demonstrate resource planning

5. Credibility and Trust
   - Highlight organizational strengths
   - Show past successes
   - Demonstrate expertise
   - Build trust through transparency

6. Compliance and Requirements
   - Follow all guidelines
   - Address all required elements
   - Meet word/character limits
   - Include all required attachments

Always ensure proposals are:
- Well-researched and data-driven
- Aligned with funder priorities
- Realistic and achievable
- Professional and polished
- Free of errors and inconsistencies

Format your responses in clear sections with proper headings and bullet points where appropriate.`;

export async function POST(request: Request) {
  try {
    console.log('Received grant proposal request');
    
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { 
          success: false,
          message: 'Authentication error' 
        }, 
        { status: 401 }
      );
    }

    if (!session) {
      console.log('No session found');
      return NextResponse.json(
        { 
          success: false,
          message: 'Please sign in to use this feature' 
        }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);
    const { project_name, project_description, project_goals, project_budget, project_timeline, user_prompt } = body;

    if (!project_name || !project_description) {
      console.log('Missing required project fields:', { project_name, project_description });
      return NextResponse.json(
        { 
          success: false,
          message: 'Project name and description are required' 
        },
        { status: 400 }
      );
    }

    console.log('Generating grant proposal for project:', project_name);
    
    // Construct the prompt using the user's input as the primary focus
    const prompt = `${user_prompt}

Project Details:
Name: ${project_name}
Description: ${project_description}
${project_goals ? `Goals: ${Array.isArray(project_goals) ? project_goals.join(', ') : project_goals}` : ''}
${project_budget ? `Budget: $${project_budget}` : ''}
${project_timeline ? `Timeline: ${project_timeline}` : ''}

Please provide a comprehensive grant proposal that addresses the user's specific request while incorporating the project details above. Structure your response with the following sections:

1. Executive Summary
2. Organization Background
3. Project Description
4. Goals and Objectives
5. Implementation Plan
6. Timeline
7. Budget Breakdown
8. Impact and Evaluation
9. Sustainability Plan

Make the proposal professional, compelling, and well-structured. Include specific metrics, timelines, and budget details where appropriate.`;

    console.log('Sending request to Anthropic');
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    console.log('Received response from Anthropic');

    if (!response || !response.content || !response.content[0]) {
      console.error('Invalid response from Anthropic:', response);
      throw new Error('Invalid response from AI service');
    }

    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : 'Failed to generate response';

    if (!responseText) {
      console.error('Empty response text');
      throw new Error('Failed to generate response content');
    }

    // Split the response into sections
    const sections = responseText.split('\n\n').reduce((acc: any, section: string) => {
      const title = section.split('\n')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
      acc[title] = section;
      return acc;
    }, {});

    console.log('Successfully generated grant proposal');
    return NextResponse.json({
      success: true,
      content: responseText,
      data: {
        sections
      },
    });
  } catch (error) {
    console.error('Error in grant route:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate grant proposal. Please try again.',
      },
      { status: 500 }
    );
  }
} 