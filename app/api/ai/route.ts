import { NextResponse } from 'next/server';
import { ChatAnthropic } from '@langchain/anthropic';
import { Donor } from '@/app/lib/donorService';
import { Grant, Volunteer, Event, Program, CommunityStakeholder, FundraisingCampaign, Project } from '@/app/lib/types';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const model = new ChatAnthropic({
  modelName: 'claude-3-opus-20240229',
  temperature: 0.7,
  maxTokens: 4000,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await request.json();

    if (!action || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let prompt = '';
    let response;

    switch (action) {
      case 'generateGrantProposal':
        if (!data.projectName || !data.projectDescription || !data.targetAmount) {
          return NextResponse.json({ error: 'Missing required project data' }, { status: 400 });
        }
        prompt = `Generate a detailed grant proposal for the following project:

Project Information:
- Name: ${data.projectName}
- Description: ${data.projectDescription}
- Target Amount: $${data.targetAmount}
${data.projectGoals ? `- Goals: ${data.projectGoals}` : ''}
${data.projectTimeline ? `- Timeline: ${data.projectTimeline}` : ''}
${data.targetAudience ? `- Target Audience: ${data.targetAudience}` : ''}
${data.organizationType ? `- Organization Type: ${data.organizationType}` : ''}
${data.previousGrants ? `- Previous Grants: ${data.previousGrants}` : ''}
${data.partners ? `- Partners: ${data.partners}` : ''}
${data.impactMetrics ? `- Impact Metrics: ${data.impactMetrics}` : ''}

Please include the following sections:
1. Executive Summary
   - Project Overview
   - Mission and Vision
   - Key Objectives
   - Expected Impact

2. Project Description
   - Detailed Project Scope
   - Methodology
   - Implementation Plan
   - Timeline and Milestones

3. Goals and Objectives
   - Specific, Measurable Goals
   - Success Criteria
   - Impact Assessment Plan

4. Budget Breakdown
   - Detailed Cost Breakdown
   - Resource Allocation
   - Sustainability Plan
   - Matching Funds (if applicable)

5. Organization Capacity
   - Team Structure
   - Relevant Experience
   - Partnerships and Collaborations
   - Track Record

6. Evaluation and Monitoring
   - Performance Metrics
   - Data Collection Methods
   - Reporting Plan
   - Quality Assurance

7. Sustainability Plan
   - Long-term Funding Strategy
   - Resource Management
   - Growth and Expansion Plans

Format the response in a clear, professional manner suitable for grant applications. Use appropriate headings and subheadings for easy navigation.`;

        response = await model.invoke(prompt);
        if (!response || !response.content) {
          throw new Error('No content was generated');
        }
        return NextResponse.json({ proposal: response.content });
        break;

      case 'generateFundraisingStrategy':
        if (!data.organizationName || !data.targetAmount) {
          return NextResponse.json({ error: 'Missing required organization data' }, { status: 400 });
        }
        prompt = `Generate a comprehensive fundraising strategy for:
Organization: ${data.organizationName}
Type: ${data.organizationType || 'Non-Profit'}
Target Amount: $${data.targetAmount}
Timeframe: ${data.timeframe || '12 months'}
Current Donors: ${data.currentDonors || 'None'}

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

        response = await model.invoke(prompt);
        if (!response || !response.content) {
          throw new Error('No content was generated');
        }
        return NextResponse.json({ strategy: response.content });
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

        response = await model.invoke(prompt);
        return NextResponse.json({ message: response.content });
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

        response = await model.invoke(prompt);
        return NextResponse.json({ analysis: response.content });
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

        response = await model.invoke(prompt);
        return NextResponse.json({ report: response.content });
        break;

      case 'matchVolunteers': {
        const { volunteers, opportunities } = data;
        prompt = `Match volunteers with opportunities based on the following data:
          Volunteers: ${JSON.stringify(volunteers, null, 2)}
          Opportunities: ${JSON.stringify(opportunities, null, 2)}

          Provide:
          1. Best matches for each opportunity
          2. Skills and interests alignment
          3. Availability considerations
          4. Recommendations for engagement
          5. Training needs`;

        response = await model.invoke(prompt);
        return NextResponse.json({ matches: response.content });
      }

      case 'optimizeEventPlan': {
        const event = data as Event;
        prompt = `Optimize the event plan for:
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

        response = await model.invoke(prompt);
        return NextResponse.json({ plan: response.content });
      }

      case 'assessProgramImpact': {
        const program = data as Program;
        prompt = `Assess the impact of the following program:
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

        response = await model.invoke(prompt);
        return NextResponse.json({ assessment: response.content });
      }

      case 'analyzeCommunityEngagement': {
        const stakeholders = data as CommunityStakeholder[];
        prompt = `Analyze community engagement based on the following stakeholders:
          ${JSON.stringify(stakeholders, null, 2)}

          Provide:
          1. Engagement level analysis
          2. Stakeholder mapping
          3. Partnership opportunities
          4. Communication strategy
          5. Community needs assessment
          6. Action recommendations`;

        response = await model.invoke(prompt);
        return NextResponse.json({ analysis: response.content });
      }

      case 'analyzeProjects': {
        const projects = data as Project[];
        prompt = `Analyze the following projects and provide insights:
          ${JSON.stringify(projects, null, 2)}

          Provide:
          1. Project Status Overview
          2. Success Rate Analysis
          3. Resource Allocation Insights
          4. Risk Assessment
          5. Timeline Performance
          6. Budget Analysis
          7. Impact Metrics
          8. Recommendations for Improvement`;

        response = await model.invoke(prompt);
        return NextResponse.json({ analysis: response.content });
      }

      case 'analyzeEvents': {
        const events = data as Event[];
        prompt = `Analyze the following events and provide insights:
          ${JSON.stringify(events, null, 2)}

          Provide:
          1. Event Performance Overview
          2. Attendance Trends
          3. Engagement Metrics
          4. Cost-Benefit Analysis
          5. Success Factors
          6. Areas for Improvement
          7. Future Event Recommendations`;

        response = await model.invoke(prompt);
        return NextResponse.json({ analysis: response.content });
      }

      case 'analyzeFundraising': {
        const { donors, projects, events } = data;
        prompt = `Analyze the overall fundraising performance based on:
          Donors: ${JSON.stringify(donors, null, 2)}
          Projects: ${JSON.stringify(projects, null, 2)}
          Events: ${JSON.stringify(events, null, 2)}

          Provide:
          1. Overall Fundraising Performance
          2. Donor Retention and Growth
          3. Project Funding Success
          4. Event-Based Fundraising Impact
          5. Key Performance Indicators
          6. Trends and Patterns
          7. Strategic Recommendations
          8. Future Opportunities`;

        response = await model.invoke(prompt);
        return NextResponse.json({ analysis: response.content });
      }

      case 'generateDonorMessage': {
        const donor = data as Donor;
        prompt = `Generate a personalized email message for a donor with the following details:
- Name: ${donor.name}
- Last Donation Amount: $${donor.amount}
- Last Donation Date: ${new Date(donor.last_donation).toLocaleDateString()}
- Engagement Score: ${donor.engagement}%
- Last Contact: ${new Date(donor.last_contact).toLocaleDateString()}

The message should:
1. Be warm and personal
2. Acknowledge their past support
3. Share a brief impact story
4. Include a gentle call to action
5. Be concise (2-3 paragraphs)
6. Be professional but friendly
7. Match their engagement level (high/medium/low)

Format the message as a complete email body, including a greeting and sign-off.`;

        response = await model.invoke(prompt);
        if (!response || !response.content) {
          throw new Error('No content was generated');
        }
        return NextResponse.json({ content: response.content });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
} 