import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Project, GrantDocument, GrantSection } from './types';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClientComponentClient();

export interface AIResponse {
  success: boolean;
  message?: string;
  content: Array<{
    type: 'text';
    text: string;
  }>;
  data?: Record<string, any>;
}

export const grantWriterService = {
  // Section-specific generation methods
  async generateSection(sectionId: string, project: Project, customPrompt?: string): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai/grant-writer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: customPrompt ? 'generate_custom_section' : `generate_${sectionId}`,
          data: {
            prompt: customPrompt,
            project: project,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate section');
      }

      const data = await response.json();
      return {
        success: data.success,
        message: data.message || 'Section generated successfully',
        content: data.content,
        data: data.data || {},
      };
    } catch (error) {
      console.error('Error generating section:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate content',
        content: [],
        data: {},
      };
    }
  },

  async generateCustomSection(prompt: string, project: Project): Promise<AIResponse> {
    return this.generateSection('custom', project, prompt);
  },

  // Document management methods
  async saveDocument(document: GrantDocument): Promise<void> {
    try {
      const { error } = await supabase
        .from('grant_documents')
        .update({
          title: document.title,
          sections: document.sections,
          status: document.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', document.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  },

  async createGrantDocument(projectId: string, title: string): Promise<GrantDocument> {
    const { data, error } = await supabase
      .from('grant_documents')
      .insert([{
        project_id: projectId,
        title,
        type: 'standard',
        status: 'draft',
        sections: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGrantDocument(id: string, updates: Partial<GrantDocument>): Promise<GrantDocument> {
    const { data, error } = await supabase
      .from('grant_documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getGrantDocument(id: string): Promise<GrantDocument | null> {
    const { data, error } = await supabase
      .from('grant_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getGrantDocuments(projectId: string): Promise<GrantDocument[]> {
    const { data, error } = await supabase
      .from('grant_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async deleteGrantDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('grant_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateGrantSection(documentId: string, sectionId: string, content: string): Promise<void> {
    try {
      // First get the current document
      const { data: document, error: fetchError } = await supabase
        .from('grant_documents')
        .select('sections')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Update the specific section
      const updatedSections = document.sections.map((section: any) => {
        if (section.id === sectionId) {
          return {
            ...section,
            content,
            status: 'generated',
            lastUpdated: new Date().toISOString(),
          };
        }
        return section;
      });

      // Update the document with the new sections
      const { error: updateError } = await supabase
        .from('grant_documents')
        .update({
          sections: updatedSections,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating section:', error);
      throw error;
    }
  }
}; 