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
  type: 'standard' | 'custom';
  createdAt: string;
  updatedAt: string;
}

const GRANT_SECTIONS = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    description: 'A concise overview of the project, its goals, and expected impact',
    required: true,
  },
  // ... rest of the sections ...
];

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
  },

  async createGrantDocument(projectId: string): Promise<GrantDocument> {
    const supabase = createClientComponentClient();
    try {
      const { data, error } = await supabase
        .from('grant_documents')
        .insert([
          {
            project_id: projectId,
            sections: GRANT_SECTIONS.map((section: { id: string; title: string; description: string; required: boolean }) => ({
              id: section.id,
              title: section.title,
              content: '',
              status: 'draft',
              lastUpdated: new Date().toISOString(),
            })),
            status: 'draft',
            type: 'standard',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating grant document:', error);
        throw new Error('Failed to create grant document');
      }

      // Transform the response to match the GrantDocument interface
      return {
        id: data.id,
        project_id: data.project_id,
        title: data.title,
        sections: data.sections,
        status: data.status,
        type: data.type,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in createGrantDocument:', error);
      throw error;
    }
  }
}; 