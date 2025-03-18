import { NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OnboardingMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ProfileUpdates {
  name?: string;
  mission?: string;
  sector?: string;
  goals?: string[];
  teamSize?: string;
  location?: string;
  website?: string;
  [key: string]: any;
}

export async function POST(req: Request) {
  try {
    const { messages, currentStep, profile } = await req.json();

    // Get the last user message
    const lastMessage = messages[messages.length - 1] as OnboardingMessage;
    if (!lastMessage || lastMessage.role !== 'user') {
      throw new Error('Invalid message format');
    }

    // Define step-specific prompts and information extraction
    const stepPrompts = [
      {
        context: "You are helping set up a nonprofit organization's profile. Extract the organization's name and respond warmly.",
        extraction: ['name'],
      },
      {
        context: "Ask about the organization's mission, sector, and any specific areas of focus.",
        extraction: ['mission', 'sector'],
      },
      {
        context: "Discuss the organization's goals and objectives. Extract specific, measurable goals.",
        extraction: ['goals'],
      },
      {
        context: "Learn about their team size and structure. Extract team size and any key roles mentioned.",
        extraction: ['teamSize'],
      },
      {
        context: "Gather contact information including location and website. Extract these details.",
        extraction: ['location', 'website'],
      },
    ];

    // Prepare the conversation for OpenAI
    const conversation: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `${stepPrompts[currentStep].context} Be conversational and helpful. Extract information naturally from the user's responses.`,
      },
      ...messages.map((msg: OnboardingMessage) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
    ];

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: conversation,
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiMessage = completion.choices[0].message.content;
    if (!aiMessage) {
      throw new Error('No response from AI');
    }

    // Extract information based on the current step
    const extractionPrompt: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `Extract the following information from the user's message: ${stepPrompts[currentStep].extraction.join(', ')}. Return as JSON.`,
      },
      {
        role: 'user',
        content: lastMessage.content,
      },
    ];

    const extraction = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: extractionPrompt,
      temperature: 0,
      max_tokens: 200,
    });

    let profileUpdates: ProfileUpdates = {};
    try {
      const extractedData = JSON.parse(extraction.choices[0].message.content || '{}');
      profileUpdates = extractedData;
    } catch (err) {
      console.error('Error parsing extracted data:', err);
    }

    // Determine if the step is complete based on required information
    const stepComplete = stepPrompts[currentStep].extraction.every(
      field => profileUpdates[field] !== undefined || profile[field] !== undefined
    );

    return NextResponse.json({
      message: aiMessage,
      profileUpdates,
      stepCompleted: stepComplete,
    });
  } catch (error) {
    console.error('Error in onboarding API:', error);
    return NextResponse.json(
      { error: 'Failed to process onboarding step' },
      { status: 500 }
    );
  }
} 