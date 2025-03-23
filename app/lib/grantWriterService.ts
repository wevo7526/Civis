import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Project } from './types';

export interface GrantSection {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'generated' | 'reviewed';
  lastUpdated: string;
}

export interface GrantDocument {
  id: string;
  project_id: string;
  title: string;
  sections: GrantSection[];
  status: 'draft' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface AIResponse {
  success: boolean;
  content: string;
  error?: string;
}

export const grantWriterService = {
  async generateSection(sectionId: string, project: Project): Promise<AIResponse> {
    try {
      // TODO: Implement AI generation logic
      return {
        success: true,
        content: 'Generated content placeholder'
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Failed to generate content'
      };
    }
  },

  async generateCustomSection(prompt: string): Promise<AIResponse> {
    try {
      // TODO: Implement custom AI generation logic
      return {
        success: true,
        content: 'Generated custom content placeholder'
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Failed to generate content'
      };
    }
  },

  async saveDocument(document: GrantDocument): Promise<void> {
    const supabase = createClientComponentClient();
    const { error } = await supabase
      .from('grant_documents')
      .upsert(document);

    if (error) throw error;
  }
}; 