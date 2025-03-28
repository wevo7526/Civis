import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { EmailTemplate } from '@/types/email';
import { 
  Grant, 
  Volunteer, 
  Event, 
  Program, 
  CommunityStakeholder, 
  FundraisingCampaign, 
  Project, 
  VolunteerActivity,
  Donor
} from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AIRequest {
  prompt: string;
  context?: {
    currentPage?: string;
    templateType?: 'donor' | 'volunteer' | 'both';
    subject?: string;
  };
}

// Validate environment variables
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not set');
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60; // 1 minute in seconds
const MAX_REQUESTS = 30; // Maximum requests per window

async function checkRateLimit(ip: string, supabase: any): Promise<boolean> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - RATE_LIMIT_WINDOW;

    // Get current rate limit record
    const { data: rateLimit, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('ip', ip)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Rate limit check error:', fetchError);
      return true; // Allow request if rate limit check fails
    }

    if (!rateLimit) {
      // Create new rate limit record
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          ip,
          count: 1,
          timestamp: now
        });

      if (insertError) {
        console.error('Rate limit insert error:', insertError);
        return true;
      }
      return true;
    }

    // Check if window has passed
    if (now - rateLimit.timestamp >= RATE_LIMIT_WINDOW) {
      // Reset counter
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({
          count: 1,
          timestamp: now
        })
        .eq('ip', ip);

      if (updateError) {
        console.error('Rate limit reset error:', updateError);
        return true;
      }
      return true;
    }

    // Check if limit exceeded
    if (rateLimit.count >= MAX_REQUESTS) {
      return false;
    }

    // Increment counter
    const { error: incrementError } = await supabase
      .from('rate_limits')
      .update({
        count: rateLimit.count + 1,
        timestamp: now
      })
      .eq('ip', ip);

    if (incrementError) {
      console.error('Rate limit increment error:', incrementError);
      return true;
    }

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
    case 'chat':
      if (!data || typeof data !== 'object') {
        return { isValid: false, message: 'Data is required' };
      }
      const chatData = data as { message: string };
      if (!chatData.message || typeof chatData.message !== 'string') {
        return { isValid: false, message: 'Message is required' };
      }
      break;

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
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { action, data, prompt, context } = await request.json();

    if (!action) {
      return NextResponse.json(
        { success: false, message: 'Action is required' },
        { status: 400 }
      );
    }

    // Validate data
    const validation = validateData(action, data);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.message },
        { status: 400 }
      );
    }

    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = await checkRateLimit(ip, supabase);
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    let systemPrompt = `You are an AI assistant specialized in nonprofit management and fundraising.
    Provide clear, concise, and actionable insights based on the data provided.
    Focus on specific metrics, trends, and recommendations that can drive fundraising success.`;

    // Add context-specific prompts
    if (context?.currentPage === 'fundraising') {
      systemPrompt = `You are an AI assistant specialized in nonprofit fundraising analysis. Your role is to analyze fundraising data and provide structured, actionable insights.

When analyzing fundraising data, provide your response in the following format:

1. Key Metrics Summary
   - Total funds raised
   - Donor retention rate
   - Average gift size
   - Recent donor activity

2. Performance Analysis
   - Donor engagement trends
   - Project funding status
   - Event fundraising success
   - Strategy effectiveness

3. Actionable Recommendations
   - High-priority actions
   - Donor engagement opportunities
   - Project funding needs
   - Strategy optimization

4. Risk Assessment
   - Potential challenges
   - Areas needing attention
   - Growth opportunities
   - Resource allocation

Focus on providing specific, data-driven insights that can be immediately acted upon. Use the provided metrics to support your analysis and recommendations.`;
    } else if (action === 'analyzeDonorStrategyAlignment') {
      systemPrompt = `You are an AI assistant specialized in nonprofit fundraising strategy alignment. Your role is to analyze how well a donor matches with available fundraising strategies.

When analyzing donor-strategy alignment, provide your response in the following format:

1. Donor Profile Analysis
   - Giving history and capacity
   - Engagement level
   - Interests and preferences
   - Communication preferences

2. Strategy Match Analysis
   - Best matching strategies
   - Alignment score (0-100)
   - Potential impact
   - Implementation timeline

3. Personalized Recommendations
   - Strategy-specific actions
   - Engagement opportunities
   - Risk factors
   - Success metrics

4. Action Plan
   - Immediate next steps
   - Required resources
   - Timeline
   - Success criteria

Focus on providing specific, actionable insights that can be used to optimize donor engagement and fundraising success.`;
    } else if (action === 'generateStrategyRecommendations') {
      systemPrompt = `You are an AI assistant specialized in nonprofit fundraising strategy development. Your role is to generate strategic recommendations based on donor segments and current strategies.

When generating strategy recommendations, provide your response in the following format:

1. Donor Segment Analysis
   - Major donors
   - Mid-level donors
   - Small donors
   - Interest-based segments

2. Current Strategy Assessment
   - Active strategies
   - Impact analysis
   - Coverage gaps
   - Resource allocation

3. Strategic Recommendations
   - Segment-specific strategies
   - Implementation priorities
   - Expected impact
   - Required resources

4. Implementation Plan
   - Timeline
   - Resource requirements
   - Success metrics
   - Risk mitigation

Focus on providing data-driven recommendations that align with donor segments and organizational goals.`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            action,
            data,
            prompt: prompt || "Generate relevant insights based on the provided data. Focus on key metrics, trends, and actionable recommendations.",
            context
          })
        }
      ],
      system: systemPrompt,
      temperature: 0.7,
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({
      success: true,
      content,
      message: 'Analysis completed successfully'
    });
  } catch (error) {
    console.error('Error in AI route:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
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