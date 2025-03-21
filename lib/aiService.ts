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
} from './types';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AIResponse {
  success: boolean;
  content: Array<{
    type: 'text';
    text: string;
  }>;
  data: {
    analyzedItems?: number;
    timestamp: string;
  };
}

async function makeAIRequest(action: AIRequest['action'], data: unknown, context?: Record<string, unknown>): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        data,
        context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.message || 'Failed to process request');
    }

    const responseData = await response.json() as AIResponse;
    return responseData.content[0].text;
  } catch (error) {
    console.error('Error making AI request:', error);
    throw error;
  }
}

export const aiService = {
  // Donor Analysis
  async analyzeDonors(donors: Donor[]): Promise<string> {
    return makeAIRequest('analyze_donors', donors);
  },

  async analyzeDonorEngagement(donor: DonorAnalysisData): Promise<string> {
    // Ensure donor data has required fields
    const validatedData = {
      ...donor,
      name: donor.name || '',
      email: donor.email || ''
    };
    return makeAIRequest('analyzeDonorEngagement', validatedData);
  },

  async generateDonorReport(donor: Donor): Promise<string> {
    // Ensure donor data has required fields
    const validatedData = {
      ...donor,
      name: donor.name || '',
      email: donor.email || ''
    };
    return makeAIRequest('generate_donor_report', validatedData);
  },

  async generateOutreachMessage(donor: Donor): Promise<string> {
    // Ensure donor data has required fields
    const validatedData = {
      ...donor,
      name: donor.name || '',
      email: donor.email || ''
    };
    return makeAIRequest('generateOutreachMessage', validatedData);
  },

  async generateDonorMessage(donor: Donor): Promise<string> {
    // Ensure donor data has required fields
    const validatedData = {
      ...donor,
      name: donor.name || '',
      email: donor.email || ''
    };
    return makeAIRequest('generateDonorMessage', validatedData);
  },

  // Project Analysis
  async analyzeProjects(projects: Project[]): Promise<string> {
    return makeAIRequest('analyzeProjects', projects);
  },

  async generateGrantProposal(project: Project): Promise<string> {
    return makeAIRequest('generate_grant_proposal', project);
  },

  // Event Analysis
  async analyzeEvents(events: Event[]): Promise<string> {
    return makeAIRequest('analyzeEvents', events);
  },

  async optimizeEventPlan(event: Event): Promise<string> {
    return makeAIRequest('optimizeEventPlan', event);
  },

  // Program Analysis
  async assessProgramImpact(program: Program): Promise<string> {
    return makeAIRequest('assessProgramImpact', program);
  },

  // Community Engagement
  async analyzeCommunityEngagement(stakeholders: CommunityStakeholder[]): Promise<string> {
    return makeAIRequest('analyzeCommunityEngagement', stakeholders);
  },

  // Volunteer Management
  async matchVolunteers(data: { volunteers: Volunteer[]; opportunities: VolunteerActivity[] }): Promise<string> {
    return makeAIRequest('matchVolunteers', data);
  },

  // Fundraising Analysis
  async analyzeFundraising(data: { donors: Donor[]; projects: Project[]; events: Event[] }): Promise<string> {
    return makeAIRequest('analyzeFundraising', data);
  }
}; 