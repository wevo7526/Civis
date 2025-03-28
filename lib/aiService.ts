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
  EventAnalysisData,
  ChatMessage
} from './types';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface StreamResponse {
  success: boolean;
  content: string;
  structuredData?: any;
  error?: string;
  status?: number;
}

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
      content: error instanceof Error ? error.message : 'An unexpected error occurred',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export const aiService = {
  // Streaming Chat
  async streamChat(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    onStructuredData: (data: any) => void
  ): Promise<StreamResponse> {
    try {
      // Validate messages before sending
      if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error('Messages array is required and must not be empty');
      }

      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages,
          system: `You are an AI assistant specialized in nonprofit management and fundraising.
          Provide both conversational responses and structured data when appropriate.
          Format structured data as JSON within <json> tags.
          Each structured data block should include:
          - type: 'analysis' | 'recommendations' | 'insights' | 'metrics'
          - title: A descriptive title
          - content: The actual data
          Keep responses clear, concise, and actionable.`
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let result = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        result += chunk;
        onChunk(chunk);

        // Try to parse structured data from the chunk
        try {
          const jsonMatch = chunk.match(/<json>([\s\S]*?)<\/json>/);
          if (jsonMatch) {
            const structuredData = JSON.parse(jsonMatch[1]);
            onStructuredData(structuredData);
          }
        } catch (e) {
          console.warn('Failed to parse structured data:', e);
        }
      }

      return {
        success: true,
        content: result
      };
    } catch (error) {
      console.error('Error in streamChat:', error);
      return {
        success: false,
        content: error instanceof Error ? error.message : 'An unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Chat
  async chat(message: string): Promise<AIResponse> {
    return makeAIRequest('chat', { message });
  },

  // Donor Analysis
  async analyzeDonors(donors: Donor[]): Promise<AIResponse> {
    return makeAIRequest('analyze_donors', donors);
  },

  async analyzeDonorEngagement(donors: Donor[]): Promise<AIResponse> {
    return makeAIRequest('analyzeDonorEngagement', donors);
  },

  async generateDonorReport(donors: Donor[]): Promise<AIResponse> {
    return makeAIRequest('generate_donor_report', donors);
  },

  async generateOutreachMessage(donor: Donor): Promise<AIResponse> {
    return makeAIRequest('generateOutreachMessage', {
      ...donor,
      name: `${donor.first_name} ${donor.last_name}`
    });
  },

  async generateDonorMessage(donor: Donor): Promise<AIResponse> {
    return makeAIRequest('generateDonorMessage', {
      ...donor,
      name: `${donor.first_name} ${donor.last_name}`
    });
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