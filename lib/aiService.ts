import { Project } from './types';

export interface AIResponse {
  message: string;
  success: boolean;
  content: string;
  data: any;
}

export const aiService = {
  async analyzeDonorEngagement(donorData: any[]): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_donor_engagement',
          data: { donorData },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze donor engagement');
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
        message: 'Failed to analyze donor engagement. Please try again.',
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
          data: { projectData },
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
            project_goals: project.goals,
            project_budget: project.budget,
            project_timeline: project.timeline,
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
        content: data.content || '',
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
  }
}; 