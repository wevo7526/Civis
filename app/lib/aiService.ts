import { createClient } from '@supabase/supabase-js';
import { Donor, Grant, Volunteer, Event, Program, CommunityStakeholder, FundraisingCampaign, Project } from './types';

interface AIResponse {
  message: string;
  suggestions?: string[];
  data?: any;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const aiService = {
  async generateOutreachMessage(donor: Donor): Promise<string> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateOutreachMessage',
          data: donor,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate outreach message');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error generating outreach message:', error);
      throw new Error('Failed to generate outreach message');
    }
  },

  async analyzeDonorEngagement(donors: Donor[]): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_donors',
          data: donors,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze donor engagement');
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing donor engagement:', error);
      throw error;
    }
  },

  async generateDonorReport(donor: Donor): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_donor_report',
          data: donor,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate donor report');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating donor report:', error);
      throw error;
    }
  },

  async generateGrantProposal(project: Project): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_grant_proposal',
          data: project,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate grant proposal');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating grant proposal:', error);
      throw error;
    }
  },

  async matchVolunteers(volunteers: Volunteer[], opportunities: string[]): Promise<string> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'matchVolunteers',
          data: { volunteers, opportunities },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to match volunteers');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error matching volunteers:', error);
      throw new Error('Failed to match volunteers');
    }
  },

  async optimizeEventPlan(event: Event): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize_event_plan',
          data: event,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize event plan');
      }

      return await response.json();
    } catch (error) {
      console.error('Error optimizing event plan:', error);
      throw error;
    }
  },

  async assessProgramImpact(project: Project): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assess_program_impact',
          data: project,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assess program impact');
      }

      return await response.json();
    } catch (error) {
      console.error('Error assessing program impact:', error);
      throw error;
    }
  },

  async analyzeCommunityEngagement(stakeholders: CommunityStakeholder[]): Promise<string> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyzeCommunityEngagement',
          data: stakeholders,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze community engagement');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error analyzing community engagement:', error);
      throw new Error('Failed to analyze community engagement');
    }
  },

  async generateFundraisingStrategy(donors: Donor[]): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_fundraising_strategy',
          data: donors,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate fundraising strategy');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating fundraising strategy:', error);
      throw error;
    }
  },

  async analyzeDonors(donors: Donor[]): Promise<string> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyzeDonors',
          data: donors,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze donors');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error analyzing donors:', error);
      throw new Error('Failed to analyze donors');
    }
  },

  async analyzeProjects(projects: Project[]): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_projects',
          data: projects,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze projects');
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing projects:', error);
      throw error;
    }
  },

  async analyzeEvents(events: Event[]): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_events',
          data: events,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze events');
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing events:', error);
      throw error;
    }
  },

  async analyzeFundraising(donors: Donor[], projects: Project[], events: Event[]): Promise<string> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyzeFundraising',
          data: { donors, projects, events },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze fundraising');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error analyzing fundraising:', error);
      throw new Error('Failed to analyze fundraising');
    }
  },

  async generateStakeholderUpdate(project: Project): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_stakeholder_update',
          data: project,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate stakeholder update');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating stakeholder update:', error);
      throw error;
    }
  },
}; 