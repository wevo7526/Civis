import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt, requirements } = await request.json();

    // Create a detailed prompt for the AI
    const systemPrompt = `You are an expert fundraising strategist. Generate 2-3 detailed fundraising strategies based on the user's requirements. Each strategy should include:
- A clear name and description
- Target amount and timeline
- Success probability and ROI estimates
- Cost to implement
- Donor segments with percentages and average gift amounts
- Monthly revenue timeline
- Risk factors with impact levels and mitigation strategies

Make the strategies realistic and tailored to the user's specific needs.
IMPORTANT: Respond ONLY with the JSON array, no additional text or explanation. Keep the response concise but complete.`;

    const userPrompt = `Based on the following fundraising goals and requirements, generate 2-3 detailed fundraising strategies:

Goals: ${prompt}

Requirements:
- Include detailed metrics and projections
- Provide a month-by-month timeline
- Break down donor segments
- Identify key risk factors

Respond with ONLY a JSON array of strategies, where each strategy follows this structure:
{
  "id": "unique-id",
  "name": "strategy name",
  "description": "detailed description",
  "targetAmount": number,
  "duration": number (months),
  "successProbability": number (0-100),
  "costToImplement": number,
  "expectedROI": number (percentage),
  "donorSegments": [
    {
      "segment": "segment name",
      "percentage": number (0-100),
      "averageGift": number
    }
  ],
  "timelineData": [
    {
      "month": "Month X",
      "expectedRevenue": number,
      "cumulativeRevenue": number
    }
  ],
  "riskFactors": [
    {
      "factor": "risk description",
      "impact": "high|medium|low",
      "mitigation": "mitigation strategy"
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const response = message.content[0];
    if (!response || response.type !== 'text') {
      throw new Error('Invalid response from AI');
    }

    // Extract just the JSON array from the response
    const jsonMatch = response.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON array found in response');
    }

    try {
      // Parse the AI response into the expected format
      const strategies = JSON.parse(jsonMatch[0]);
      
      // Validate that we have at least one complete strategy
      if (!Array.isArray(strategies) || strategies.length === 0) {
        throw new Error('No valid strategies found in response');
      }

      // Validate each strategy has required fields
      strategies.forEach((strategy, index) => {
        const requiredFields = [
          'id', 'name', 'description', 'targetAmount', 'duration',
          'successProbability', 'costToImplement', 'expectedROI',
          'donorSegments', 'timelineData', 'riskFactors'
        ];
        
        const missingFields = requiredFields.filter(field => !(field in strategy));
        if (missingFields.length > 0) {
          throw new Error(`Strategy ${index + 1} is missing required fields: ${missingFields.join(', ')}`);
        }
      });

      return NextResponse.json({ strategies });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI response into valid strategies');
    }
  } catch (error) {
    console.error('Error generating strategies:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate strategies' },
      { status: 500 }
    );
  }
} 