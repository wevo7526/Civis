import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      organizationName,
      organizationType,
      targetAmount,
      timeframe,
      currentDonors,
      mission,
      previousFundraising,
      keyPrograms,
    } = data;

    // Create a comprehensive prompt for the AI
    const prompt = `Create a detailed fundraising strategy for ${organizationName}, a ${organizationType} organization.

Key Information:
- Target Amount: $${targetAmount}
- Timeframe: ${timeframe}
- Current Donors: ${currentDonors}
- Mission: ${mission}
- Previous Fundraising: ${previousFundraising}
- Key Programs: ${keyPrograms}

Please provide a comprehensive fundraising strategy that includes:

1. Executive Summary
2. Funding Goals and Timeline
3. Donor Strategy
   - Target Donor Segments
   - Engagement Approaches
   - Communication Plan
4. Fundraising Methods
   - Events
   - Digital Campaigns
   - Grant Opportunities
   - Corporate Partnerships
5. Budget Allocation
6. Success Metrics
7. Risk Management
8. Implementation Timeline

Also provide:
- 3 key insights about the organization's fundraising potential
- 5 actionable recommendations for success

Format the response as a structured markdown document.`;

    // Generate the strategy using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert fundraising strategist with deep knowledge of nonprofit development, donor psychology, and campaign planning. Provide detailed, actionable advice tailored to the specific organization and context."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const strategyContent = completion.choices[0].message.content;
    if (!strategyContent) {
      throw new Error('Failed to generate strategy content');
    }

    // Extract insights and recommendations using another AI call
    const insightsPrompt = `Based on the following fundraising strategy, extract 3 key insights and 5 actionable recommendations:

${strategyContent}

Format the response as JSON with two arrays: "insights" and "recommendations".`;

    const insightsCompletion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing fundraising strategies and extracting key insights and recommendations."
        },
        {
          role: "user",
          content: insightsPrompt
        }
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const insightsContent = insightsCompletion.choices[0].message.content;
    if (!insightsContent) {
      throw new Error('Failed to generate insights content');
    }

    const { insights, recommendations } = JSON.parse(insightsContent);

    return NextResponse.json({
      strategy: strategyContent,
      insights,
      recommendations,
    });
  } catch (error) {
    console.error('Error generating fundraising strategy:', error);
    return NextResponse.json(
      { error: 'Failed to generate fundraising strategy' },
      { status: 500 }
    );
  }
} 