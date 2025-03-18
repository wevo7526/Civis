import { Project } from './types';

export interface AIResponse {
  message: string;
  success: boolean;
}

export async function generateGrantProposal(project: Project): Promise<AIResponse> {
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
      throw new Error('Failed to generate grant proposal');
    }

    const data = await response.json();
    return {
      message: data.content[0].text,
      success: true,
    };
  } catch (error) {
    console.error('Error generating grant proposal:', error);
    return {
      message: 'Failed to generate grant proposal. Please try again.',
      success: false,
    };
  }
} 