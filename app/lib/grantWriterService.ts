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
      console.log('Starting saveDocument with document:', document);

      // Transform the document to match the database schema
      const dbDocument = {
        id: document.id,
        project_id: document.project_id,
        title: document.title || 'Untitled Grant Document',
        sections: document.sections.map(section => ({
          ...section,
          last_updated: section.last_updated || new Date().toISOString()
        })),
        status: document.status || 'draft',
        success_status: document.success_status || null,
        type: document.type || 'standard',
        created_at: document.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Transformed document for database:', dbDocument);

      // Get the current user's ID from the session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      // First, check if the document exists
      const { data: existingDoc, error: fetchError } = await supabase
        .from('grant_documents')
        .select('*')
        .eq('id', document.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking existing document:', fetchError);
        throw new Error(`Failed to check existing document: ${fetchError.message}`);
      }

      let result;
      if (existingDoc) {
        // If document exists, update it
        result = await supabase
          .from('grant_documents')
          .update(dbDocument)
          .eq('id', document.id)
          .select()
          .single();
      } else {
        // If document doesn't exist, insert it
        result = await supabase
          .from('grant_documents')
          .insert([dbDocument])
          .select()
          .single();
      }

      if (result.error) {
        console.error('Error saving to grant_documents:', result.error);
        throw new Error(`Failed to save grant document: ${result.error.message}`);
      }

      console.log('Successfully saved to grant_documents:', result.data);

      // Save to writing_items table
      const writingItem = {
        id: document.id,
        title: document.title || 'Untitled Grant Document',
        content: JSON.stringify(document.sections),
        type: 'grant',
        project_id: document.project_id,
        status: document.status || 'draft',
        user_id: session.user.id,
        created_at: document.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Saving to writing_items:', writingItem);

      const { error: writingError } = await supabase
        .from('writing_items')
        .upsert(writingItem);

      if (writingError) {
        console.error('Error saving to writing_items:', writingError);
        throw new Error(`Failed to save writing item: ${writingError.message}`);
      }

      // Create a version in writing_versions
      const version = {
        writing_item_id: document.id,
        title: document.title || 'Untitled Grant Document',
        content: JSON.stringify(document.sections),
        user_id: session.user.id,
        created_at: new Date().toISOString()
      };

      console.log('Creating writing version:', version);

      const { error: versionError } = await supabase
        .from('writing_versions')
        .insert(version);

      if (versionError) {
        console.error('Error saving version:', versionError);
        // Don't throw here as this is not critical
      }

      console.log('Document saved successfully');
    } catch (error) {
      console.error('Error in saveDocument:', error);
      throw error;
    }
  },

  async createGrantDocument(projectId: string, title: string): Promise<GrantDocument> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    if (!title) {
      throw new Error('Title is required');
    }

    try {
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

      if (error) {
        console.error('Error creating grant document:', error);
        throw new Error(`Failed to create grant document: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from create operation');
      }

      return data;
    } catch (error) {
      console.error('Error in createGrantDocument:', error);
      throw error;
    }
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