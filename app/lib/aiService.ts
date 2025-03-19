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
      const response = await fetch('/api/ai/generate-grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate grant proposal');
      }

      const data = await response.json();
      return {
        message: data.message || 'No proposal available',
        success: true,
        content: data.content || '',
        data: data.data || {},
      };
    } catch (error) {
      console.error('Error generating grant proposal:', error);
      return {
        message: 'Failed to generate grant proposal. Please try again.',
        success: false,
        content: 'I apologize, but I encountered an error while generating the grant proposal.',
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