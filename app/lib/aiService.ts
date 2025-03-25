import type { Project, AIResponse } from './types';

export const aiService = {
  async analyzeProjects(projectData: Project[]): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai/analyze-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectData }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze projects');
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        content: [{
          type: 'text' as const,
          text: error instanceof Error ? error.message : 'Unknown error occurred'
        }],
        data: {
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  async chat(message: string): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        content: [{
          type: 'text' as const,
          text: error instanceof Error ? error.message : 'Unknown error occurred'
        }],
        data: {
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}; 