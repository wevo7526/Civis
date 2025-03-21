import { Project, AIResponse } from './types';

export const aiService = {
  async analyzeDonorEngagement(donorData: any[]): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_donors',
          data: donorData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze donor engagement');
      }

      const data = await response.json();
      return {
        message: data.content[0].text,
        success: true,
        content: data.content[0].text,
        data: data.data || {},
      };
    } catch (error) {
      console.error('Error analyzing donor engagement:', error);
      return {
        message: error instanceof Error ? error.message : 'Failed to analyze donor engagement. Please try again.',
        success: false,
        content: '',
        data: {},
      };
    }
  },

  async analyzeProjects(projectData: any[]): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_projects',
          data: projectData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze projects');
      }

      const data = await response.json();
      return {
        message: data.content[0].text,
        success: true,
        content: data.content[0].text,
        data: data.data || {},
      };
    } catch (error) {
      console.error('Error analyzing projects:', error);
      return {
        message: 'Failed to analyze projects. Please try again.',
        success: false,
        content: '',
        data: {},
      };
    }
  },

  async analyzeEvents(eventData: any[]): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_events',
          data: { eventData },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze events');
      }

      const data = await response.json();
      return {
        message: data.content[0].text,
        success: true,
        content: data.content[0].text,
        data: data.data || {},
      };
    } catch (error) {
      console.error('Error analyzing events:', error);
      return {
        message: 'Failed to analyze events. Please try again.',
        success: false,
        content: '',
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
            organization_info: project.organization_info || '',
            budget_breakdown: project.budget_breakdown || '',
            evaluation_metrics: project.evaluation_metrics || '',
            sustainability_plan: project.sustainability_plan || '',
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
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_fundraising_strategy',
          data: {
            project_name: project.name,
            project_description: project.description,
            project_goals: project.goals || [],
            project_budget: project.budget || 0,
            project_timeline: project.timeline || '',
            organization_info: project.organization_info || '',
            impact_target: project.impact_target || '',
            impact_metric: project.impact_metric || '',
            team_size: project.team_size || 0,
            team_roles: project.team_roles || [],
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate fundraising strategy');
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Fundraising strategy generated successfully',
        content: data.content[0]?.text || '',
        data: data.data || {},
      };
    } catch (error) {
      console.error('Error generating fundraising strategy:', error);
      return {
        success: false,
        message: 'Failed to generate fundraising strategy. Please try again.',
        content: '',
        data: {},
      };
    }
  }
}; 