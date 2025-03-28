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

interface FundraisingAnalysisData {
  donors: Donor[];
  projects: Project[];
  events: Event[];
  strategies: FundraisingStrategy[];
}

interface FundraisingStrategy {
  id: string;
  name: string;
  description: string;
  donor_id?: string;
  impact?: number;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
}

async function makeAIRequest(action: AIRequest, data: unknown): Promise<AIResponse> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action, 
        data,
        context: {
          currentPage: 'fundraising'
        }
      }),
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
          const jsonMatch = chunk.match(/<json>(.*?)<\/json>/s);
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
  async analyzeFundraising(data: FundraisingAnalysisData): Promise<AIResponse> {
    const { donors, projects, events, strategies } = data;
    
    // Format data for analysis
    const formattedData = {
      donors: {
        total: donors.length,
        active: donors.filter(d => d.status === 'active').length,
        totalRaised: donors.reduce((sum, d) => sum + (d.total_given || 0), 0),
        averageGift: donors.length > 0 ? donors.reduce((sum, d) => sum + (d.total_given || 0), 0) / donors.length : 0,
        retentionRate: donors.length > 0 ? (donors.filter(d => d.status === 'active').length / donors.length) * 100 : 0,
        recentDonors: donors.filter(d => {
          const lastDonation = new Date(d.last_donation_date || '');
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return lastDonation > thirtyDaysAgo;
        }).length,
        segments: {
          major: donors.filter(d => (d.total_given || 0) >= 10000).length,
          mid: donors.filter(d => (d.total_given || 0) >= 1000 && (d.total_given || 0) < 10000).length,
          small: donors.filter(d => (d.total_given || 0) < 1000).length,
        }
      },
      projects: {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        underfunded: projects.filter(p => {
          const raised = events
            .filter(e => e.type === 'fundraiser' && e.status === 'completed')
            .reduce((sum, e) => sum + (e.amount_raised || 0), 0);
          return raised < (p.budget * 0.5);
        }).length,
        totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0)
      },
      events: {
        total: events.length,
        recent: events.filter(e => {
          const eventDate = new Date(e.date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return eventDate > thirtyDaysAgo;
        }).length,
        totalRaised: events.reduce((sum, e) => sum + (e.amount_raised || 0), 0)
      },
      strategies: {
        total: strategies.length,
        active: strategies.filter(s => s.status === 'active').length,
        averageImpact: strategies.length > 0 
          ? strategies.reduce((sum, s) => sum + (s.impact || 0), 0) / strategies.length 
          : 0,
        donorMatches: strategies.filter(s => s.donor_id).length
      }
    };

    return makeAIRequest('analyzeFundraising', formattedData);
  },

  analyzeTrends(donors: Donor[], events: Event[]): string[] {
    const trends = [];
    
    // Analyze donation trends
    const recentDonors = donors.filter(d => {
      const lastDonation = new Date(d.last_donation_date || '');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastDonation > thirtyDaysAgo;
    });

    if (recentDonors.length > 0) {
      trends.push(`Recent donor activity shows ${recentDonors.length} new donations in the last 30 days`);
    }

    // Analyze event participation
    const recentEvents = events.filter(e => {
      const eventDate = new Date(e.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return eventDate > thirtyDaysAgo;
    });

    if (recentEvents.length > 0) {
      trends.push(`Recent events have generated ${recentEvents.reduce((sum, e) => sum + (e.amount_raised || 0), 0)} in donations`);
    }

    return trends;
  },

  generateRecommendations(
    donors: Donor[], 
    projects: Project[], 
    events: Event[], 
    strategies: FundraisingStrategy[]
  ): string[] {
    const recommendations = [];

    // Analyze donor engagement
    const lowEngagementDonors = donors.filter(d => (d.interaction_count || 0) < 2);
    if (lowEngagementDonors.length > 0) {
      recommendations.push(`Consider re-engaging ${lowEngagementDonors.length} donors with low interaction rates`);
    }

    // Analyze project funding
    const underfundedProjects = projects.filter(p => {
      const raised = events
        .filter(e => e.type === 'fundraiser' && e.status === 'completed')
        .reduce((sum, e) => sum + (e.amount_raised || 0), 0);
      return raised < (p.budget * 0.5);
    });

    if (underfundedProjects.length > 0) {
      recommendations.push(`${underfundedProjects.length} projects are underfunded and may need additional fundraising efforts`);
    }

    // Analyze strategy effectiveness
    const activeStrategies = strategies.filter(s => s.status === 'active');
    if (activeStrategies.length > 0) {
      const avgImpact = activeStrategies.reduce((sum, s) => sum + (s.impact || 0), 0) / activeStrategies.length;
      recommendations.push(`Current fundraising strategies have an average potential impact of $${avgImpact.toLocaleString()}`);
    }

    return recommendations;
  },

  analyzeDonorSegments(donors: Donor[]): string {
    const segments = {
      major: donors.filter(d => (d.total_given || 0) >= 10000).length,
      mid: donors.filter(d => (d.total_given || 0) >= 1000 && (d.total_given || 0) < 10000).length,
      small: donors.filter(d => (d.total_given || 0) < 1000).length,
    };

    return `
- Major Donors (>$10k): ${segments.major}
- Mid-Level Donors ($1k-$10k): ${segments.mid}
- Small Donors (<$1k): ${segments.small}`;
  },

  async analyzeDonorStrategyAlignment(donor: Donor, strategies: FundraisingStrategy[]): Promise<AIResponse> {
    // Format donor data for analysis
    const donorData = {
      donor: {
        name: `${donor.first_name} ${donor.last_name}`,
        totalGiven: donor.total_given || 0,
        lastDonation: donor.last_donation_date,
        status: donor.status,
        interests: donor.interests || [],
        interactionCount: donor.interaction_count || 0,
        preferredContact: donor.preferred_contact || 'email'
      },
      strategies: strategies.map(s => ({
        name: s.name,
        description: s.description,
        impact: s.impact || 0,
        status: s.status,
        donorId: s.donor_id
      }))
    };

    return makeAIRequest('analyzeDonorStrategyAlignment', donorData);
  },

  async generateStrategyRecommendations(data: FundraisingAnalysisData): Promise<AIResponse> {
    const { donors, projects, events, strategies } = data;
    
    // Format data for analysis
    const formattedData = {
      donors: {
        total: donors.length,
        segments: {
          major: donors.filter(d => (d.total_given || 0) >= 10000).length,
          mid: donors.filter(d => (d.total_given || 0) >= 1000 && (d.total_given || 0) < 10000).length,
          small: donors.filter(d => (d.total_given || 0) < 1000).length,
        },
        interests: donors.reduce((acc, d) => {
          const interests = d.interests || [];
          interests.forEach(interest => {
            acc[interest] = (acc[interest] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>)
      },
      projects: {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0)
      },
      events: {
        total: events.length,
        totalRaised: events.reduce((sum, e) => sum + (e.amount_raised || 0), 0)
      },
      currentStrategies: strategies.map(s => ({
        name: s.name,
        description: s.description,
        impact: s.impact || 0,
        status: s.status,
        donorId: s.donor_id
      }))
    };

    return makeAIRequest('generateStrategyRecommendations', formattedData);
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