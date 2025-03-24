import { NextResponse } from 'next/server';
import { FundraisingCampaign } from '@/app/lib/types';

export async function POST(request: Request) {
  try {
    const { campaign } = await request.json() as { campaign: FundraisingCampaign };

    // Return mock insights for now
    const insights = {
      insights: [
        `Current fundraising progress is at ${(campaign.current_amount / campaign.goal * 100).toFixed(1)}% of the target goal`,
        `Campaign is in ${campaign.status} status with ${campaign.target_audience} as target audience`,
        `Time remaining: ${new Date(campaign.end_date).getTime() - new Date().getTime() > 0 ? 'Active' : 'Completed'}`
      ],
      recommendations: [
        'Consider reaching out to new potential donors in your target audience',
        'Review and optimize your campaign strategy based on current progress',
        'Engage with existing donors to maintain momentum',
        'Update campaign materials to reflect current progress',
        'Plan follow-up activities based on campaign status'
      ]
    };

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
} 