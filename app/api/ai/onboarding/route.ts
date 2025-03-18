import { NextRequest, NextResponse } from 'next/server';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';

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

// Initialize the model outside the handler
const model = new ChatAnthropic({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  modelName: 'claude-3-opus-20240229',
  temperature: 0.7,
  maxTokens: 1000,
});

// Define step-specific prompts outside the handler
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

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { messages, currentStep, profile } = body;

    if (!messages || !Array.isArray(messages) || typeof currentStep !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1] as OnboardingMessage;
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }

    // Convert messages to Langchain format
    const conversationMessages = [
      new SystemMessage({
        content: `${stepPrompts[currentStep].context} Be conversational and helpful. Extract information naturally from the user's responses.`
      }),
      ...messages.map((msg: OnboardingMessage) => 
        msg.role === 'assistant' 
          ? new AIMessage({ content: msg.content })
          : new HumanMessage({ content: msg.content })
      )
    ];

    // Get AI response
    const response = await model.invoke(conversationMessages);
    const aiMessage = response.content;

    if (!aiMessage) {
      throw new Error('No response from AI');
    }

    // Extract information based on the current step
    const extractionMessages = [
      new SystemMessage({
        content: `Extract the following information from the user's message: ${stepPrompts[currentStep].extraction.join(', ')}. Return ONLY a valid JSON object with these fields. Do not include any other text or explanation.`
      }),
      new HumanMessage({ content: lastMessage.content })
    ];

    const extraction = await model.invoke(extractionMessages);
    
    let profileUpdates: ProfileUpdates = {};
    try {
      // Find the JSON object in the response
      const extractionContent = extraction.content.toString();
      const jsonMatch = extractionContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        profileUpdates = JSON.parse(jsonMatch[0]);
      } else {
        console.warn('No JSON found in extraction response:', extractionContent);
      }
    } catch (err) {
      console.error('Error parsing extracted data:', err);
      console.log('Raw extraction response:', extraction.content);
    }

    // Determine if the step is complete based on required information
    const stepComplete = stepPrompts[currentStep].extraction.every(
      field => profileUpdates[field] !== undefined || profile?.[field] !== undefined
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