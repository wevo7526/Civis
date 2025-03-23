import { Project } from './types';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export interface AIResponse {
  success: boolean;
  content: string;
  data?: {
    analyzedItems?: number;
    timestamp?: string;
    estimatedAmount?: number;
    timeline?: string[];
    recommendations?: string[];
  };
  error?: string;
}

const GRANT_SECTIONS = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    description: 'A concise overview of the project, its goals, and expected impact',
    required: true,
  },
  {
    id: 'organization_background',
    title: 'Organization Background & Mission',
    description: 'History, mission, and track record of the organization',
    required: true,
  },
  {
    id: 'project_overview',
    title: 'Project Overview & Goals',
    description: 'Detailed description of the project and its objectives',
    required: true,
  },
  {
    id: 'problem_statement',
    title: 'Problem Statement & Need',
    description: 'Clear articulation of the problem and why this project is needed',
    required: true,
  },
  {
    id: 'target_population',
    title: 'Target Population & Impact',
    description: 'Description of beneficiaries and expected impact',
    required: true,
  },
  {
    id: 'methodology',
    title: 'Project Design & Methodology',
    description: 'Detailed approach to implementing the project',
    required: true,
  },
  {
    id: 'timeline',
    title: 'Timeline & Milestones',
    description: 'Project schedule and key milestones',
    required: true,
  },
  {
    id: 'budget',
    title: 'Budget & Resource Allocation',
    description: 'Detailed budget breakdown and resource requirements',
    required: true,
  },
  {
    id: 'evaluation',
    title: 'Evaluation & Success Metrics',
    description: 'How project success will be measured and evaluated',
    required: true,
  },
  {
    id: 'sustainability',
    title: 'Sustainability Plan',
    description: 'How the project will be sustained beyond the grant period',
    required: true,
  },
  {
    id: 'partnerships',
    title: 'Partnerships & Collaborations',
    description: 'Key partners and their roles in the project',
    required: false,
  },
  {
    id: 'capacity',
    title: 'Organizational Capacity',
    description: 'Organization\'s ability to implement the project',
    required: true,
  },
];

interface GrantWriterRequest {
  action: string;
  section?: string;
  prompt?: string;
  content?: string;
}

async function makeGrantWriterRequest(request: GrantWriterRequest): Promise<AIResponse> {
  try {
    // Transform the request to match the API's expected format
    const apiRequest = {
      action: request.action,
      data: {
        prompt: request.prompt,
        content: request.content,
      },
    };

    const response = await fetch('/api/ai/grant-writer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.message || 'Failed to process request');
    }

    const responseData = await response.json() as AIResponse;
    return responseData;
  } catch (error) {
    console.error('Error in grant writer request:', error);
    throw error;
  }
}

function formatContent(content: string): string {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n\n');
}

export const grantWriterService = {
  // Section-specific generation methods
  async generateExecutiveSummary(): Promise<AIResponse> {
    return makeGrantWriterRequest({
      action: 'generate_executive_summary',
    });
  },

  async generateOrganizationBackground(): Promise<AIResponse> {
    return makeGrantWriterRequest({
      action: 'generate_organization_background',
    });
  },

  async generateProjectOverview(): Promise<AIResponse> {
    return makeGrantWriterRequest({
      action: 'generate_project_overview',
    });
  },

  async generateProblemStatement(): Promise<AIResponse> {
    return makeGrantWriterRequest({
      action: 'generate_problem_statement',
    });
  },

  async generateTargetPopulation(): Promise<AIResponse> {
    return makeGrantWriterRequest({
      action: 'generate_target_population',
    });
  },

  async generateMethodology(): Promise<AIResponse> {
    return makeGrantWriterRequest({
      action: 'generate_methodology',
    });
  },

  async generateTimeline(): Promise<AIResponse> {
    return makeGrantWriterRequest({
      action: 'generate_timeline',
    });
  },

  async generateBudget(): Promise<AIResponse> {
    return makeGrantWriterRequest({
      action: 'generate_budget',
    });
  },

  async generateEvaluation(): Promise<AIResponse> {
    return makeGrantWriterRequest({
      action: 'generate_evaluation',
    });
  },

  async generateSustainability(): Promise<AIResponse> {
    return makeGrantWriterRequest({
      action: 'generate_sustainability',
    });
  },

  async generatePartnerships(): Promise<AIResponse> {
    return makeGrantWriterRequest({
      action: 'generate_partnerships',
    });
  },

  async generateCapacity(): Promise<AIResponse> {
    return makeGrantWriterRequest({
      action: 'generate_capacity',
    });
  },

  async generateCustomSection(prompt: string): Promise<AIResponse> {
    return makeGrantWriterRequest({
      action: 'generate_custom_section',
      prompt,
    });
  },

  // Review methods
  async reviewSection(sectionId: string, content: string): Promise<AIResponse> {
    return makeGrantWriterRequest({
      action: 'review_section',
      section: sectionId,
      content,
    });
  },

  // Document management methods
  async createGrantDocument(projectId: string): Promise<GrantDocument> {
    try {
      const { data, error } = await supabase
        .from('grant_documents')
        .insert([
          {
            project_id: projectId,
            title: 'Grant Proposal',
            sections: GRANT_SECTIONS.map(section => ({
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
  },

  async updateGrantSection(documentId: string, sectionId: string, content: string): Promise<void> {
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
  },

  async getGrantDocument(documentId: string): Promise<GrantDocument> {
    const { data, error } = await supabase
      .from('grant_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) throw error;
    return data;
  },
}; 