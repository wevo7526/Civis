import { NextResponse } from 'next/server';
import { ChatAnthropic } from '@langchain/anthropic';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const SYSTEM_PROMPT = `You are an AI onboarding assistant for Civis, a nonprofit management platform. Your role is to help new users set up their organization profile through a conversational interface.

Follow these guidelines:
1. Be friendly and professional
2. Ask one question at a time
3. Validate user responses
4. Guide users through the onboarding process
5. Mark steps as completed when all required information is gathered

The onboarding process has these steps:
1. Welcome & Organization Overview
   - Get organization name (store in full_name)
   - Understand mission and cause (store in bio)
   - Get location and timezone

2. Organization Details
   - Get organization size
   - Get website and social media links

3. Goals & Objectives
   - Define key objectives (store in goals array)
   - Get preferred communication methods

4. Initial Projects
   - Create first project
   - Identify required skills (store in skills array)

5. Team Setup
   - Set up roles and permissions
   - Set availability and timezone

For each step:
1. Ask relevant questions
2. Validate responses
3. Store information in the appropriate profile fields
4. Mark step as completed when all required information is gathered

Remember to:
- Keep responses concise and clear
- Provide examples when helpful
- Validate information before proceeding
- Guide users through each step
- Store information in the appropriate profile fields
- Mark steps as completed when all required information is gathered

When a step is completed, respond with "STEP COMPLETED: [Step Name]" at the end of your message.`;

export async function POST(req: Request) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const { messages, currentStep } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Initialize Anthropic client
    const model = new ChatAnthropic({
      modelName: 'claude-3-opus-20240229',
      temperature: 0.7,
      maxTokens: 1000,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Convert messages to Anthropic format
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // Add system message with current step context
    const systemMessage = {
      role: 'system',
      content: `${SYSTEM_PROMPT}\n\nCurrent step: ${currentStep}`,
    };

    // Get AI response
    const response = await model.invoke([
      systemMessage,
      ...formattedMessages,
    ]);

    // Check if the current step is completed
    const responseContent = response.content.toString();
    const stepCompleted = responseContent.toLowerCase().includes('step completed');

    // If step is completed, update the profile
    if (stepCompleted) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      // Extract information from the conversation
      const lastUserMessage = messages[messages.length - 1].content;
      const lastAssistantMessage = responseContent;

      // Update profile based on the current step
      const updates: any = {
        onboarding_step: currentStep + 1,
      };

      switch (currentStep) {
        case 0: // Welcome & Organization Overview
          if (lastUserMessage.includes('organization') || lastUserMessage.includes('name')) {
            updates.full_name = lastUserMessage;
          }
          if (lastUserMessage.includes('mission') || lastUserMessage.includes('cause')) {
            updates.bio = lastUserMessage;
          }
          if (lastUserMessage.includes('location') || lastUserMessage.includes('timezone')) {
            updates.location = lastUserMessage;
            updates.timezone = lastUserMessage;
          }
          break;

        case 1: // Organization Details
          if (lastUserMessage.includes('website') || lastUserMessage.includes('url')) {
            updates.website_url = lastUserMessage;
          }
          if (lastUserMessage.includes('linkedin')) {
            updates.linkedin_url = lastUserMessage;
          }
          break;

        case 2: // Goals & Objectives
          if (lastUserMessage.includes('goal') || lastUserMessage.includes('objective')) {
            updates.goals = [lastUserMessage];
          }
          if (lastUserMessage.includes('communicate') || lastUserMessage.includes('contact')) {
            updates.preferred_communication = lastUserMessage;
          }
          break;

        case 3: // Initial Projects
          if (lastUserMessage.includes('skill') || lastUserMessage.includes('expertise')) {
            updates.skills = [lastUserMessage];
          }
          break;

        case 4: // Team Setup
          if (lastUserMessage.includes('available') || lastUserMessage.includes('schedule')) {
            updates.availability = lastUserMessage;
          }
          if (lastUserMessage.includes('role') || lastUserMessage.includes('position')) {
            updates.role = lastUserMessage;
          }
          break;
      }

      // Update the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }

      // If this was the last step, mark onboarding as completed
      if (currentStep === 4) {
        const { error: completeError } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', session.user.id);

        if (completeError) {
          console.error('Error completing onboarding:', completeError);
          throw completeError;
        }
      }
    }

    return NextResponse.json({
      message: responseContent,
      stepCompleted,
    });
  } catch (error) {
    console.error('Error in onboarding endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 