import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { FundraisingStrategy } from '@/app/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { strategy } = await request.json() as { strategy: FundraisingStrategy };

    // Create a prompt for analyzing the strategy and generating insights
    const prompt = `Analyze the following fundraising strategy and provide updated insights and recommendations based on its current progress and status.

Strategy Details:
- Organization: ${strategy.organization_name}
- Type: ${strategy.organization_type}
- Target Amount: $${strategy.target_amount}
- Current Progress: ${strategy.progress}%
- Status: ${strategy.status}
- Timeframe: ${strategy.timeframe}
- Current Donors: ${strategy.current_donors}

Mission:
${strategy.mission}

Key Programs:
${strategy.key_programs}

Previous Fundraising Experience:
${strategy.previous_fundraising}

Current Strategy:
${strategy.strategy_content}

Based on this information, please provide:
1. 3 key insights about the current fundraising progress and potential
2. 5 actionable recommendations for improving or maintaining momentum

Format the response as JSON with two arrays: "insights" and "recommendations".`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert fundraising strategist who provides data-driven insights and actionable recommendations based on current progress and context."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('Failed to generate insights content');
    }

    const { insights, recommendations } = JSON.parse(content);

    return NextResponse.json({
      insights,
      recommendations,
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
} 