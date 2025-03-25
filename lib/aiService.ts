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
  AIResponse,
  DonorAnalysisData, 
  ProjectAnalysisData, 
  EventAnalysisData 
} from './types';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function makeAIRequest(action: AIRequest, data: unknown): Promise<AIResponse> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, data }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || responseData.message || `HTTP error! status: ${response.status}`);
    }

    if (!responseData.success) {
      throw new Error(responseData.message || 'Request failed');
    }

    return {
      ...responseData,
      content: formatContent(responseData.content)
    };
  } catch (error) {
    console.error('Error making AI request:', error);
    return {
      success: false,
      content: [{
        text: error instanceof Error ? error.message : 'An unexpected error occurred'
      }],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export const aiService = {
  // Chat
  async chat(message: string): Promise<AIResponse> {
    return makeAIRequest('chat', { message });
  },

  // Donor Analysis
  async analyzeDonors(donors: Donor[]): Promise<AIResponse> {
    return makeAIRequest('analyze_donors', donors);
  },

  async analyzeDonorEngagement(donor: DonorAnalysisData): Promise<AIResponse> {
    // Ensure donor data has required fields
    const validatedData = {
      ...donor,
      name: donor.name || '',
      email: donor.email || ''
    };
    return makeAIRequest('analyzeDonorEngagement', validatedData);
  },

  async generateDonorReport(donor: Donor): Promise<AIResponse> {
    // Ensure donor data has required fields
    const validatedData = {
      ...donor,
      name: donor.name || '',
      email: donor.email || ''
    };
    return makeAIRequest('generate_donor_report', validatedData);
  },

  async generateOutreachMessage(donor: Donor): Promise<AIResponse> {
    // Ensure donor data has required fields
    const validatedData = {
      ...donor,
      name: donor.name || '',
      email: donor.email || ''
    };
    return makeAIRequest('generateOutreachMessage', validatedData);
  },

  async generateDonorMessage(donor: Donor): Promise<AIResponse> {
    // Ensure donor data has required fields
    const validatedData = {
      ...donor,
      name: donor.name || '',
      email: donor.email || ''
    };
    return makeAIRequest('generateDonorMessage', validatedData);
  },

  // Project Analysis
  async analyzeProjects(projects: Project[]): Promise<AIResponse> {
    return makeAIRequest('analyzeProjects', projects);
  },

  // Event Analysis
  async analyzeEvents(events: Event[]): Promise<AIResponse> {
    return makeAIRequest('analyzeEvents', events);
  },

  async optimizeEventPlan(event: Event): Promise<AIResponse> {
    return makeAIRequest('optimizeEventPlan', event);
  },

  // Program Analysis
  async assessProgramImpact(program: Program): Promise<AIResponse> {
    return makeAIRequest('assessProgramImpact', program);
  },

  // Community Engagement
  async analyzeCommunityEngagement(stakeholders: CommunityStakeholder[]): Promise<AIResponse> {
    return makeAIRequest('analyzeCommunityEngagement', stakeholders);
  },

  // Volunteer Management
  async matchVolunteers(data: { volunteers: Volunteer[]; opportunities: VolunteerActivity[] }): Promise<AIResponse> {
    return makeAIRequest('matchVolunteers', data);
  },

  // Fundraising Analysis
  async analyzeFundraising(data: { donors: Donor[]; projects: Project[]; events: Event[] }): Promise<AIResponse> {
    return makeAIRequest('analyzeFundraising', data);
  }
};

function formatContent(content: string | Array<{ text: string }>): string | Array<{ text: string }> {
  if (Array.isArray(content)) {
    return content.map(item => ({
      text: item.text.trim()
    }));
  }
  
  if (typeof content === 'string') {
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n');
  }

  return '';
} 