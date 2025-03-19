import { createClient } from '@supabase/supabase-js';
import { Donor, Grant, Volunteer, Event, Program, CommunityStakeholder, FundraisingCampaign, Project } from './types';

interface AIResponse {
  message: string;
  success: boolean;
  content: string;
  data: any;
  error?: string;
}

export const aiService = {
  async chat(message: string, context: string[] = []): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return {
        message: data.message || 'No response available',
        success: true,
        content: data.content || '',
        data: data.data || {},
      };
    } catch (error) {
      console.error('Error in AI chat:', error);
      return {
        message: 'Failed to get response. Please try again.',
        success: false,
        content: 'I apologize, but I encountered an error. Please try again.',
        data: {},
      };
    }
  },

  async analyzeDonorEngagement(donorData: any[]): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai/analyze-donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donorData }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze donor engagement');
      }

      const data = await response.json();
      return {
        message: data.message || 'No analysis available',
        success: true,
        content: data.content || '',
        data: data.data || {},
      };
    } catch (error) {
      console.error('Error analyzing donor engagement:', error);
      return {
        message: 'Failed to analyze donor engagement. Please try again.',
        success: false,
        content: 'I apologize, but I encountered an error while analyzing donor engagement.',
        data: {},
      };
    }
  },

  async analyzeProjects(projectData: any[]): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai/analyze-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectData }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze projects');
      }

      const data = await response.json();
      return {
        message: data.message || 'No analysis available',
        success: true,
        content: data.content || '',
        data: data.data || {},
      };
    } catch (error) {
      console.error('Error analyzing projects:', error);
      return {
        message: 'Failed to analyze projects. Please try again.',
        success: false,
        content: 'I apologize, but I encountered an error while analyzing projects.',
        data: {},
      };
    }
  },

  async generateGrantProposal(project: Project): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_grant_proposal',
          data: {
            project_name: project.name,
            project_description: project.description,
            project_goals: project.goals || [],
            project_budget: project.budget || 0,
            project_timeline: project.timeline || '',
            impact_target: project.impact_target || '',
            impact_metric: project.impact_metric || '',
            team_size: project.team_size || 0,
            team_roles: project.team_roles || [],
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || 'Failed to generate grant proposal',
          content: '',
          data: {},
        };
      }

      const data = await response.json();
      
      if (!data.success) {
        return {
          success: false,
          message: data.message || 'Failed to generate grant proposal',
          content: '',
          data: {},
        };
      }

      return {
        success: true,
        message: 'Grant proposal generated successfully',
        content: data.content[0]?.text || '',
        data: data.data || {},
      };
    } catch (error) {
      console.error('Error generating grant proposal:', error);
      return {
        success: false,
        message: 'Failed to generate grant proposal. Please try again.',
        content: '',
        data: {},
      };
    }
  },

  async generateFundraisingStrategy(project: Project): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai/generate-fundraising', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate fundraising strategy');
      }

      const data = await response.json();
      return {
        message: data.message || 'No strategy available',
        success: true,
        content: data.content || '',
        data: data.data || {},
      };
    } catch (error) {
      console.error('Error generating fundraising strategy:', error);
      return {
        message: 'Failed to generate fundraising strategy. Please try again.',
        success: false,
        content: 'I apologize, but I encountered an error while generating the fundraising strategy.',
        data: {},
      };
    }
  }
}; 