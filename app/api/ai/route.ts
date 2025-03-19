import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { Donor } from '../../lib/types';
import { Grant, Volunteer, Event, Program, CommunityStakeholder, FundraisingCampaign, Project } from '../../lib/types';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

interface AIResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SYSTEM_PROMPT = `You are an AI assistant specialized in nonprofit management and fundraising. Your role is to help nonprofit organizations with:

1. Donor Relations
- Analyzing donor engagement and behavior
- Generating personalized donor reports
- Creating fundraising strategies
- Writing thank you notes and updates

2. Project Management
- Analyzing project progress and impact
- Generating grant proposals
- Creating stakeholder updates
- Assessing program effectiveness

3. Event Planning
- Optimizing event plans
- Analyzing event success metrics
- Suggesting improvements
- Budget optimization

4. General Support
- Writing and content creation
- Data analysis and insights
- Strategic planning
- Best practices recommendations

Always provide clear, actionable advice and maintain a professional, supportive tone.`;

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Please sign in to use this feature' 
        }, 
        { status: 401 }
      );
    }

    const { action, data, context } = await request.json();

    if (!action) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Action is required' 
        },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Data is required' 
        },
        { status: 400 }
      );
    }

    let prompt = '';

    switch (action) {
      case 'analyze_donors':
        prompt = `Analyze the following donor data and provide insights on engagement levels, giving patterns, and recommendations for improvement:

${JSON.stringify(data, null, 2)}

Please provide:
1. Key engagement metrics
2. Giving pattern analysis
3. Specific recommendations for improvement
4. Suggested next steps`;
        break;

      case 'analyze_projects':
        prompt = `Analyze the following project data and provide insights on progress, challenges, and recommendations:

${JSON.stringify(data, null, 2)}

Please provide:
1. Progress assessment
2. Risk analysis
3. Resource utilization
4. Recommendations for improvement`;
        break;

      case 'analyze_events':
        prompt = `Analyze the following event data and provide insights on success metrics, challenges, and recommendations:

${JSON.stringify(data, null, 2)}

Please provide:
1. Success metrics analysis
2. Budget efficiency
3. Attendance insights
4. Recommendations for future events`;
        break;

      case 'generate_donor_report':
        prompt = `Generate a personalized donor report for the following donor:

${JSON.stringify(data, null, 2)}

Please include:
1. Giving history summary
2. Impact of their contributions
3. Engagement metrics
4. Personalized recommendations`;
        break;

      case 'generate_grant_proposal': {
        const project = data;
        
        prompt = `Generate a comprehensive grant proposal for the following project:

Project Name: ${project.project_name || 'Not specified'}
Description: ${project.project_description || 'Not specified'}
Goals: ${project.project_goals?.join(', ') || 'Not specified'}
Budget: $${project.project_budget || 'Not specified'}
Timeline: ${project.project_timeline || 'Not specified'}
Impact Target: ${project.impact_target || 'Not specified'}
Impact Metric: ${project.impact_metric || 'Not specified'}
Team Size: ${project.team_size || 'Not specified'}
Team Roles: ${project.team_roles?.join(', ') || 'Not specified'}

Please include the following sections:
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

        // Get response from Claude
        const aiResponse = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          system: SYSTEM_PROMPT,
          temperature: 0.7,
        });

        if (!aiResponse || !aiResponse.content || !aiResponse.content[0]) {
          throw new Error('Invalid response from AI service');
        }

        const responseText = aiResponse.content[0].type === 'text' 
          ? aiResponse.content[0].text 
          : 'Failed to generate response';

        return NextResponse.json({
          success: true,
          content: [{
            type: 'text',
            text: responseText
          }],
          data: {
            sections: {
              executive_summary: responseText.split('\n\n')[0] || '',
              organization_background: responseText.split('\n\n')[1] || '',
              project_description: responseText.split('\n\n')[2] || '',
              goals_and_objectives: responseText.split('\n\n')[3] || '',
              implementation_plan: responseText.split('\n\n')[4] || '',
              timeline: responseText.split('\n\n')[5] || '',
              budget_breakdown: responseText.split('\n\n')[6] || '',
              impact_and_evaluation: responseText.split('\n\n')[7] || '',
              sustainability_plan: responseText.split('\n\n')[8] || '',
            },
          },
        });
      }

      case 'optimize_event_plan':
        prompt = `Optimize the following event plan:

${JSON.stringify(data, null, 2)}

Please provide:
1. Timeline optimization
2. Budget efficiency suggestions
3. Marketing recommendations
4. Risk mitigation strategies`;
        break;

      case 'assess_program_impact':
        prompt = `Assess the impact of the following program:

${JSON.stringify(data, null, 2)}

Please provide:
1. Impact metrics
2. Success indicators
3. Areas for improvement
4. Recommendations for scaling`;
        break;

      case 'generate_stakeholder_update':
        prompt = `Generate a stakeholder update for the following project:

${JSON.stringify(data, null, 2)}

Please include:
1. Progress summary
2. Key achievements
3. Challenges and solutions
4. Next steps`;
        break;

      case 'generate_fundraising_strategy':
        prompt = `Generate a fundraising strategy based on the following donor data:

${JSON.stringify(data, null, 2)}

Please provide:
1. Target audience analysis
2. Campaign recommendations
3. Timeline suggestions
4. Resource allocation advice`;
        break;

      case 'generateOutreachMessage': {
        const donor = data as Donor;
        const currentDate = new Date().toISOString();
        const lastDonationDate = (donor.last_donation || donor.donation_date || currentDate) as string;
        const lastContactDate = (donor.last_contact || donor.created_at || currentDate) as string;
        const daysSinceLastDonation = Math.floor((new Date().getTime() - new Date(lastDonationDate).getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceLastContact = Math.floor((new Date().getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
        
        prompt = `Generate a personalized email message for a donor with the following details:
- Name: ${donor.name}
- Last Donation Amount: $${donor.amount}
- Last Donation Date: ${new Date(lastDonationDate).toLocaleDateString()}
- Engagement Score: ${donor.engagement || 0}%
- Last Contact: ${new Date(lastContactDate).toLocaleDateString()}

The message should:
1. Be warm and personal
2. Acknowledge their past support
3. Highlight the impact of their contributions
4. Include a specific ask or call to action
5. Maintain a professional yet friendly tone`;
        break;
      }

      case 'analyzeDonorEngagement': {
        // Validate required data
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid donor data format');
        }

        // Ensure all required fields are present
        const requiredFields = ['name', 'engagement_level', 'last_donation', 'total_donations', 'donation_frequency'];
        const missingFields = requiredFields.filter(field => !(field in data));
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        prompt = `Analyze the donor engagement data and provide insights:

Donor Information:
- Name: ${data.name}
- Engagement Level: ${data.engagement_level}
- Last Donation: ${data.last_donation}
- Total Donations: ${data.total_donations}
- Donation Frequency: ${data.donation_frequency}

Please provide a detailed analysis including:
1. Engagement Analysis
   - Current engagement level assessment
   - Historical engagement trends
   - Key engagement indicators

2. Strengths and Opportunities
   - Key strengths in donor relationship
   - Areas for improvement
   - Potential engagement opportunities

3. Recommendations for Improvement
   - Specific actions to enhance engagement
   - Communication strategy suggestions
   - Follow-up recommendations

4. Risk Assessment
   - Potential engagement risks
   - Mitigation strategies
   - Early warning indicators

5. Action Items
   - Immediate next steps
   - Short-term goals
   - Long-term engagement strategy

Please format the response in a clear, structured manner with bullet points for easy reading.`;
        break;
      }

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
        break;
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
        break;
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
        break;
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
        break;
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
        break;
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
        break;
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
        break;
      }

      case 'generateDonorMessage': {
        const donor = data as Donor;
        const currentDate = new Date().toISOString();
        const lastDonationDate = (donor.last_donation || donor.donation_date || currentDate) as string;
        const lastContactDate = (donor.last_contact || donor.created_at || currentDate) as string;
        const daysSinceLastDonation = Math.floor((new Date().getTime() - new Date(lastDonationDate).getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceLastContact = Math.floor((new Date().getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
        
        prompt = `Generate a personalized email message for a donor with the following details:
- Name: ${donor.name}
- Last Donation Amount: $${donor.amount}
- Last Donation Date: ${new Date(lastDonationDate).toLocaleDateString()}
- Engagement Score: ${donor.engagement || 0}%
- Last Contact: ${new Date(lastContactDate).toLocaleDateString()}

The message should:
1. Be warm and personal
2. Acknowledge their past support
3. Share a brief impact story
4. Include a gentle call to action
5. Be concise (2-3 paragraphs)
6. Be professional but friendly
7. Match their engagement level (high/medium/low)

Format the message as a complete email body, including a greeting and sign-off.`;
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    if (!response || !response.content || !response.content[0]) {
      throw new Error('Invalid response from AI service');
    }

    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : 'Failed to generate response';

    // Store the interaction in Supabase
    try {
      await supabase.from('ai_interactions').insert({
        action,
        prompt,
        response: responseText,
        context: context || {},
        created_at: new Date().toISOString(),
      });
    } catch (dbError) {
      console.error('Error storing AI interaction:', dbError);
    }

    return NextResponse.json({
      success: true,
      content: responseText,
      data: {
        sections: {
          executive_summary: responseText.split('\n\n')[0] || '',
          organization_background: responseText.split('\n\n')[1] || '',
          project_description: responseText.split('\n\n')[2] || '',
          goals_and_objectives: responseText.split('\n\n')[3] || '',
          implementation_plan: responseText.split('\n\n')[4] || '',
          timeline: responseText.split('\n\n')[5] || '',
          budget_breakdown: responseText.split('\n\n')[6] || '',
          impact_and_evaluation: responseText.split('\n\n')[7] || '',
          sustainability_plan: responseText.split('\n\n')[8] || '',
        },
      },
    });
  } catch (error) {
    console.error('Error in AI route:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate content. Please try again.',
      },
      { status: 500 }
    );
  }
}

function extractSuggestions(text: string): string[] {
  // Extract bullet points or numbered lists from the response
  const suggestions = text.match(/[-•*]\s*(.+?)(?=\n|$)/g) || 
                     text.match(/\d+\.\s*(.+?)(?=\n|$)/g);
  
  if (!suggestions) return [];
  
  return suggestions.map(s => s.replace(/[-•*\d.]\s*/, '').trim());
} 