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
      content: [{
        text: error instanceof Error ? error.message : 'An unexpected error occurred'
      }],
      error: error instanceof Error ? error.message : 'Unknown error'
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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      let buffer = '';
      let currentStructuredData = '';
      let isCollectingJson = false;
      let hasError = false;

      while (true) {
        try {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          buffer += chunk;

          // Process complete chunks
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                  const content = parsed.choices[0].delta.content;
                  onChunk(content);

                  // Handle structured data collection
                  if (content.includes('<json>')) {
                    isCollectingJson = true;
                    currentStructuredData = '';
                  } else if (content.includes('</json>')) {
                    isCollectingJson = false;
                    try {
                      const structuredData = JSON.parse(currentStructuredData);
                      onStructuredData(structuredData);
                    } catch (e) {
                      console.error('Failed to parse structured data:', e);
                      hasError = true;
                    }
                    currentStructuredData = '';
                  } else if (isCollectingJson) {
                    currentStructuredData += content;
                  }
                }
              } catch (e) {
                console.error('Failed to parse chunk:', e);
                hasError = true;
              }
            }
          }
        } catch (error) {
          console.error('Error reading stream:', error);
          hasError = true;
          break;
        }
      }

      return {
        success: !hasError,
        content: buffer,
        status: response.status,
      };
    } catch (error) {
      console.error('Error in streaming chat:', error);
      return {
        success: false,
        content: error instanceof Error ? error.message : 'An unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
        status: error instanceof Error && 'status' in error ? (error as any).status : 500,
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