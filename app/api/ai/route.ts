import { NextResponse } from 'next/server';
import { ChatAnthropic } from '@langchain/anthropic';
import { Donor } from '@/app/lib/donorService';
import { Grant, Volunteer, Event, Program, CommunityStakeholder, FundraisingCampaign } from '@/app/lib/types';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const model = new ChatAnthropic({
  modelName: 'claude-3-sonnet-20240229',
  temperature: 0.7,
  maxTokens: 4000,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await request.json();

    let prompt = '';
    let response;

    switch (action) {
      case 'generateGrantProposal':
        prompt = `Generate a detailed grant proposal for the following project:
Project Name: ${data.projectName}
Description: ${data.projectDescription}
Target Amount: $${data.targetAmount}

Please include:
1. Executive Summary
2. Project Overview
3. Goals and Objectives
4. Methodology
5. Budget Breakdown
6. Timeline
7. Expected Impact
8. Sustainability Plan

Format the response in a clear, professional manner suitable for grant applications.`;
        break;

      case 'generateFundraisingStrategy':
        prompt = `Generate a comprehensive fundraising strategy for:
Organization: ${data.organizationName}
Type: ${data.organizationType}
Target Amount: $${data.targetAmount}
Timeframe: ${data.timeframe}
Current Donors: ${data.currentDonors}

Please include:
1. Fundraising Goals and Objectives
2. Target Donor Segments
3. Fundraising Methods and Channels
4. Timeline and Milestones
5. Budget Allocation
6. Marketing and Communication Strategy
7. Donor Engagement Plan
8. Success Metrics
9. Risk Management

Format the response in a clear, actionable manner suitable for implementation.`;
        break;

      case 'generateOutreachMessage':
        prompt = `Generate a personalized outreach message for a donor with the following details:
Name: ${data.name}
Engagement Level: ${data.engagement_level}
Last Donation: ${data.last_donation}
Total Donations: ${data.total_donations}

The message should be:
1. Personalized and warm
2. Acknowledge their past support
3. Highlight the impact of their contributions
4. Include a specific ask or call to action
5. Maintain a professional yet friendly tone`;
        break;

      case 'analyzeDonorEngagement':
        prompt = `Analyze the donor engagement data and provide insights:
Donor: ${data.name}
Engagement Level: ${data.engagement_level}
Last Donation: ${data.last_donation}
Total Donations: ${data.total_donations}
Donation Frequency: ${data.donation_frequency}

Please provide:
1. Engagement Analysis
2. Strengths and Opportunities
3. Recommendations for Improvement
4. Risk Assessment
5. Action Items`;
        break;

      case 'generateDonorReport':
        prompt = `Generate a comprehensive donor report based on the following data:
Total Donors: ${data.length}
Donor List: ${JSON.stringify(data)}

Please include:
1. Executive Summary
2. Key Metrics and Statistics
3. Donor Demographics
4. Giving Patterns
5. Engagement Analysis
6. Recommendations
7. Action Items`;
        break;

      case 'matchVolunteers': {
        const { volunteers, opportunities } = data;
        const prompt = `Match volunteers with opportunities based on the following data:
          Volunteers: ${JSON.stringify(volunteers, null, 2)}
          Opportunities: ${JSON.stringify(opportunities, null, 2)}

          Provide:
          1. Best matches for each opportunity
          2. Skills and interests alignment
          3. Availability considerations
          4. Recommendations for engagement
          5. Training needs`;

        const response = await model.invoke(prompt);
        return NextResponse.json({ content: response.content });
      }

      case 'optimizeEventPlan': {
        const event = data as Event;
        const prompt = `Optimize the event plan for:
          Title: ${event.title}
          Type: ${event.type}
          Date: ${new Date(event.date).toLocaleDateString()}
          Location: ${event.location}
          Budget: $${event.budget}
          Target Attendees: ${event.target_attendees}

          Provide:
          1. Timeline optimization
          2. Budget allocation recommendations
          3. Marketing strategy
          4. Risk management plan
          5. Success metrics
          6. Contingency plans`;

        const response = await model.invoke(prompt);
        return NextResponse.json({ content: response.content });
      }

      case 'assessProgramImpact': {
        const program = data as Program;
        const prompt = `Assess the impact of the following program:
          Name: ${program.name}
          Description: ${program.description}
          Duration: ${new Date(program.start_date).toLocaleDateString()} - ${new Date(program.end_date).toLocaleDateString()}
          Budget: $${program.budget}
          Target Impact: ${program.target_impact}

          Provide:
          1. Impact measurement framework
          2. Key performance indicators
          3. Data collection strategy
          4. Success criteria
          5. Recommendations for improvement`;

        const response = await model.invoke(prompt);
        return NextResponse.json({ content: response.content });
      }

      case 'analyzeCommunityEngagement': {
        const stakeholders = data as CommunityStakeholder[];
        const prompt = `Analyze community engagement based on the following stakeholders:
          ${JSON.stringify(stakeholders, null, 2)}

          Provide:
          1. Engagement level analysis
          2. Stakeholder mapping
          3. Partnership opportunities
          4. Communication strategy
          5. Community needs assessment
          6. Action recommendations`;

        const response = await model.invoke(prompt);
        return NextResponse.json({ content: response.content });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    response = await model.invoke(prompt);

    let result;
    switch (action) {
      case 'generateGrantProposal':
        result = { proposal: response.content };
        break;
      case 'generateFundraisingStrategy':
        result = { strategy: response.content };
        break;
      case 'generateOutreachMessage':
        result = { message: response.content };
        break;
      case 'analyzeDonorEngagement':
        result = { analysis: response.content };
        break;
      case 'generateDonorReport':
        result = { report: response.content };
        break;
      default:
        result = { content: response.content };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
} 