import { createClient } from '@supabase/supabase-js';
import { Donor, Grant, Volunteer, Event, Program, CommunityStakeholder, FundraisingCampaign, Project } from './types';

interface AIResponse {
  success: boolean;
  content: string | null;
  error: string | null;
}

export const createAIService = () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return {
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

    async generateGrantProposal(project: Project, prompt?: string): Promise<AIResponse> {
      try {
        const response = await fetch('/api/projects/grants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project_name: project.name,
            project_description: project.description,
            project_goals: project.goals,
            project_budget: project.budget,
            project_timeline: project.timeline,
            user_prompt: prompt || 'Generate a comprehensive grant proposal for this project.'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate grant proposal');
        }

        const data = await response.json();
        return {
          success: true,
          content: data.content,
          error: null
        };
      } catch (error) {
        console.error('Error generating grant proposal:', error);
        return {
          success: false,
          content: null,
          error: 'Failed to generate grant proposal. Please try again.'
        };
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

    async generateFundraisingStrategy(project: Project, prompt?: string): Promise<AIResponse> {
      try {
        const response = await fetch('/api/projects/fundraising', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project_name: project.name,
            project_description: project.description,
            project_goals: project.goals,
            project_budget: project.budget,
            project_timeline: project.timeline,
            user_prompt: prompt || 'Generate a comprehensive fundraising strategy for this project.'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate fundraising strategy');
        }

        const data = await response.json();
        return {
          success: true,
          content: data.content,
          error: null
        };
      } catch (error) {
        console.error('Error generating fundraising strategy:', error);
        return {
          success: false,
          content: null,
          error: 'Failed to generate fundraising strategy. Please try again.'
        };
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

    async analyzeProjects(projects: Project[], prompt?: string): Promise<AIResponse> {
      try {
        const response = await fetch('/api/projects/insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projects: projects.map(project => ({
              name: project.name,
              description: project.description,
              goals: project.goals,
              budget: project.budget,
              timeline: project.timeline,
            })),
            user_prompt: prompt || 'Analyze these projects and provide comprehensive insights.'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze projects');
        }

        const data = await response.json();
        return {
          success: true,
          content: data.content,
          error: null
        };
      } catch (error) {
        console.error('Error analyzing projects:', error);
        return {
          success: false,
          content: null,
          error: 'Failed to analyze projects. Please try again.'
        };
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
};

// Create and export a default instance
export const aiService = createAIService(); 