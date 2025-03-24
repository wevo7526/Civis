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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.message || 'Failed to process request');
    }

    const responseData = await response.json() as AIResponse;
    return {
      ...responseData,
      content: formatContent(responseData.content)
    };
  } catch (error) {
    console.error('Error making AI request:', error);
    throw error;
  }
}

export const aiService = {
  // Chat
  async chat(message: string, context: string[] = []): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return {
        success: true,
        content: data.content || data.message || 'No response available',
        message: data.message,
        data: data.data || {},
      };
    } catch (error) {
      console.error('Error getting AI response:', error);
      return {
        success: false,
        content: 'I apologize, but I encountered an error while processing your request.',
        message: 'Failed to get AI response. Please try again.',
        data: {},
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
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
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'analyzeFundraising', data }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || 'Failed to process request');
      }

      const responseData = await response.json() as AIResponse;
      
      // Ensure content is a string before formatting
      const content = typeof responseData.content === 'string' 
        ? responseData.content 
        : JSON.stringify(responseData.content);

      return {
        ...responseData,
        content: formatContent(content)
      };
    } catch (error) {
      console.error('Error analyzing fundraising:', error);
      return {
        success: false,
        content: 'Failed to analyze fundraising data. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

function formatContent(content: string): string {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n\n');
} 