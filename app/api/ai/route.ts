import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { 
  Donor, 
  Grant, 
  Volunteer, 
  Event, 
  Program, 
  CommunityStakeholder, 
  FundraisingCampaign, 
  Project, 
  VolunteerActivity,
  AIRequest, 
  DonorAnalysisData, 
  ProjectAnalysisData, 
  EventAnalysisData 
} from '@/lib/types';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

interface AIResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

// Validate environment variables
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not set');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60; // 1 minute in seconds
const MAX_REQUESTS = 30; // Maximum requests per window

async function checkRateLimit(userId: string): Promise<boolean> {
  try {
    const { data: requests, error } = await supabase
      .from('ai_rate_limits')
      .select('count, last_request')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow request if rate limit check fails
    }

    const now = new Date();
    const lastRequest = requests?.last_request ? new Date(requests.last_request) : null;
    const timeDiff = lastRequest ? (now.getTime() - lastRequest.getTime()) / 1000 : RATE_LIMIT_WINDOW;

    if (!lastRequest || timeDiff >= RATE_LIMIT_WINDOW) {
      // Reset counter if window has passed
      await supabase
        .from('ai_rate_limits')
        .upsert({
          user_id: userId,
          count: 1,
          last_request: now.toISOString(),
        });
      return true;
    }

    if (requests.count >= MAX_REQUESTS) {
      return false;
    }

    // Increment counter
    await supabase
      .from('ai_rate_limits')
      .update({
        count: requests.count + 1,
        last_request: now.toISOString(),
      })
      .eq('user_id', userId);

    return true;
  } catch (error) {
    console.error('Rate limit error:', error);
    return true; // Allow request if rate limiting fails
  }
}

const GLOBAL_SYSTEM_PROMPT = `You are an AI assistant specialized in nonprofit management and fundraising. Your role is to provide expert advice and guidance to nonprofit organizations on various aspects of their operations, including:

1. Fundraising and Development
   - Fundraising strategies
   - Donor engagement
   - Grant writing
   - Special events
   - Online fundraising

2. Program Development
   - Program design
   - Impact measurement
   - Service delivery
   - Community engagement
   - Program evaluation

3. Organizational Management
   - Strategic planning
   - Board governance
   - Financial management
   - Human resources
   - Volunteer management

4. Marketing and Communications
   - Brand development
   - Social media strategy
   - Public relations
   - Community outreach
   - Stakeholder engagement

5. Compliance and Risk Management
   - Legal requirements
   - Financial regulations
   - Risk assessment
   - Insurance
   - Policy development

Please provide practical, actionable advice based on nonprofit best practices and current industry standards. Focus on:
- Clear, concise recommendations
- Step-by-step guidance
- Real-world examples
- Resource suggestions
- Implementation tips

Always maintain a professional tone and emphasize ethical practices and transparency.`;

const AGENT_SYSTEM_PROMPT = `You are an AI assistant specialized in nonprofit management and fundraising. Your role is to help nonprofit organizations with:

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

const validateData = (action: string, data: unknown): { isValid: boolean; message?: string } => {
  // Handle specialized agent requests
  switch (action) {
    case 'analyze_donors':
    case 'analyzeDonorEngagement':
    case 'generateOutreachMessage':
    case 'generateDonorMessage':
    case 'generate_donor_report':
      if (!data || typeof data !== 'object') {
        return { isValid: false, message: 'Data is required' };
      }
      // Only validate donor data for donor-specific actions
      const donorData = data as Record<string, unknown>;
      if (!donorData.name || !donorData.email) {
        return { isValid: false, message: 'Donor name and email are required' };
      }
      break;

    case 'analyze_projects':
    case 'analyzeProjects':
      if (!Array.isArray(data)) {
        return { isValid: false, message: 'Project data must be an array' };
      }
      if (data.length === 0) {
        return { isValid: false, message: 'No project data provided' };
      }
      if (!data.every(item => 
        typeof item === 'object' && 
        'id' in item && 
        'name' in item && 
        'status' in item
      )) {
        return { isValid: false, message: 'Invalid project data structure' };
      }
      break;

    case 'analyze_events':
    case 'analyzeEvents':
      if (!Array.isArray(data)) {
        return { isValid: false, message: 'Event data must be an array' };
      }
      if (data.length === 0) {
        return { isValid: false, message: 'No event data provided' };
      }
      if (!data.every(item => 
        typeof item === 'object' && 
        'id' in item && 
        'name' in item && 
        'date' in item
      )) {
        return { isValid: false, message: 'Invalid event data structure' };
      }
      break;

    case 'generate_grant_proposal':
      if (!data || typeof data !== 'object') {
        return { isValid: false, message: 'Project data is required' };
      }
      const project = data as Project;
      // Only validate that we have some basic project information
      if (!project.name && !project.description && !project.goals?.length) {
        return { isValid: false, message: 'At least one of: project name, description, or goals is required' };
      }
      break;

    case 'matchVolunteers':
      if (!data || typeof data !== 'object' || !('volunteers' in data) || !('opportunities' in data)) {
        return { isValid: false, message: 'Volunteer and opportunity data are required' };
      }
      break;

    case 'analyzeCommunityEngagement':
      if (!Array.isArray(data)) {
        return { isValid: false, message: 'Stakeholder data must be an array' };
      }
      break;

    case 'analyzeFundraising':
      if (!data || typeof data !== 'object' || !('donors' in data) || !('projects' in data) || !('events' in data)) {
        return { isValid: false, message: 'Donor, project, and event data are required' };
      }
      break;
  }

  return { isValid: true };
};

export async function POST(request: Request) {
  try {
    // Authentication
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Please sign in to use this feature' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitAllowed = await checkRateLimit(session.user.id);
    if (!rateLimitAllowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, data, context } = body;

    // Handle specialized agent requests
    if (!action) {
      return NextResponse.json(
        { success: false, message: 'Action is required' },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Data is required' },
        { status: 400 }
      );
    }

    // Data validation
    const validation = validateData(action, data);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.message },
        { status: 400 }
      );
    }

    // Process request
    let prompt = '';
    let response;

    switch (action) {
      case 'analyze_donors':
        prompt = `Analyze the following donor data and provide insights on engagement levels, giving patterns, and recommendations for improvement:

${JSON.stringify(data, null, 2)}

Please provide:
1. Key engagement metrics
2. Giving patterns and trends
3. Recommendations for improvement
4. Risk assessment for donor retention`;
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

      case 'generate_grant_proposal': {
        const project = data as Project;
        prompt = `Generate a compelling grant proposal for the following project:

Project Name: ${project.name || 'Not specified'}
Description: ${project.description || 'Not specified'}
Goals: ${project.goals?.join(', ') || 'Not specified'}
Budget: $${project.budget || 'Not specified'}
Timeline: ${project.timeline || 'Not specified'}
Impact Target: ${project.impact_target || 'Not specified'}
Impact Metric: ${project.impact_metric || 'Not specified'}
Team Size: ${project.team_size || 'Not specified'}
Team Roles: ${project.team_roles?.join(', ') || 'Not specified'}

Please create a grant proposal that includes:

1. Executive Summary
   - Project overview
   - Key objectives
   - Expected impact
   - Funding request

2. Project Description
   - Detailed activities
   - Implementation approach
   - Timeline
   - Team structure

3. Impact & Evaluation
   - Expected outcomes
   - Success metrics
   - Evaluation plan
   - Sustainability measures

4. Budget & Resources
   - Cost breakdown
   - Resource allocation
   - In-kind contributions
   - Sustainability plan

Make the proposal:
- Clear and concise
- Data-driven
- Professional yet engaging
- Focused on impact
- Easy to understand

Use specific examples and metrics where available. Maintain a professional tone throughout.`;
        break;
      }

      case 'generate_donor_report':
        prompt = `Generate a personalized donor report for the following donor:

${JSON.stringify(data, null, 2)}

Please include:
1. Giving history summary
2. Impact of their contributions
3. Engagement metrics
4. Personalized recommendations`;
        break;

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
        const donorData = data as {
          name: string;
          engagement_level: string;
          last_donation: string;
          total_donations: number;
          donation_frequency: string;
        };

        prompt = `Analyze the donor engagement data and provide insights:

Donor Information:
- Name: ${donorData.name}
- Engagement Level: ${donorData.engagement_level}
- Last Donation: ${donorData.last_donation}
- Total Donations: ${donorData.total_donations}
- Donation Frequency: ${donorData.donation_frequency}

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
        const matchData = data as {
          volunteers: Volunteer[];
          opportunities: VolunteerActivity[];
        };
        
        prompt = `Match volunteers with opportunities based on the following data:
          Volunteers: ${JSON.stringify(matchData.volunteers, null, 2)}
          Opportunities: ${JSON.stringify(matchData.opportunities, null, 2)}

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
          Name: ${event.name}
          Type: ${event.type}
          Date: ${new Date(event.date).toLocaleDateString()}
          Location: ${event.location}
          Budget: $${event.budget || 'Not specified'}
          Max Volunteers: ${event.max_volunteers || 'Not specified'}

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
        const fundraisingData = data as {
          donors: Donor[];
          projects: Project[];
          events: Event[];
        };
        
        prompt = `Analyze the overall fundraising performance based on:
          Donors: ${JSON.stringify(fundraisingData.donors, null, 2)}
          Projects: ${JSON.stringify(fundraisingData.projects, null, 2)}
          Events: ${JSON.stringify(fundraisingData.events, null, 2)}

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

    try {
      response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 2000, // Increased for longer grant proposals
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        system: AGENT_SYSTEM_PROMPT,
        temperature: 0.7,
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

      // Format the response for better readability
      const formattedResponse = responseText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n\n');

      // Store the interaction in Supabase
      await supabase.from('ai_interactions').insert({
        user_id: session.user.id,
        action,
        prompt,
        response: formattedResponse,
        context: context || {},
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        content: [{
          type: 'text',
          text: formattedResponse
        }],
        data: {
          analyzedItems: Array.isArray(data) ? data.length : 0,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error processing AI request:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to process AI request. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred. Please try again.' },
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