'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams, useRouter } from 'next/navigation';
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  SparklesIcon, 
  UserGroupIcon, 
  CalendarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import type { Project } from '@/lib/types';
import { aiService } from '@/lib/aiService';
import { grantWriterService, GrantDocument } from '@/lib/grantWriterService';
import SavedItemCard from '../../../components/SavedItemCard';
import GrantDocumentEditor from '../../../components/GrantDocumentEditor';
import DocumentEditor from '../../../components/DocumentEditor';

interface SavedItems {
  grants: any[];
  fundraising: any[];
  insights: any[];
}

interface EditorItem {
  id: string;
  title: string;
  content: string;
  type: 'grant' | 'fundraising' | 'insights';
}

export default function ProjectDetails() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingStates, setLoadingStates] = useState<{
    grantProposal: boolean;
    fundraisingStrategy: boolean;
    insights: boolean;
  }>({
    grantProposal: false,
    fundraisingStrategy: false,
    insights: false,
  });
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<SavedItems>({
    grants: [],
    fundraising: [],
    insights: [],
  });
  const [showEditor, setShowEditor] = useState(false);
  const [editorType, setEditorType] = useState<'grant' | 'fundraising' | 'insights' | null>(null);
  const [editorItem, setEditorItem] = useState<EditorItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGrantDocument, setCurrentGrantDocument] = useState<GrantDocument | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchProject();
    fetchSavedItems();
  }, [params.id]);

  useEffect(() => {
    if (project?.id) {
      fetchSavedItems();
    }
  }, [project?.id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedItems = async () => {
    if (!project) return;

    try {
      // Fetch grant documents
      const { data: grantDocs, error: grantError } = await supabase
        .from('grant_documents')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (grantError) throw grantError;

      // Fetch fundraising strategies
      const { data: fundraisingItems, error: fundraisingError } = await supabase
        .from('writing_items')
        .select('*')
        .eq('project_id', project.id)
        .eq('type', 'fundraising')
        .order('created_at', { ascending: false });

      if (fundraisingError) throw fundraisingError;

      // Fetch insights
      const { data: insights, error: insightsError } = await supabase
        .from('project_content')
        .select('*')
        .eq('project_id', project.id)
        .eq('type', 'insights')
        .order('created_at', { ascending: false });

      if (insightsError) throw insightsError;

      // Add type property to each item
      const grantsWithType = (grantDocs || []).map(doc => ({ ...doc, type: 'grant' }));
      const fundraisingWithType = (fundraisingItems || []).map(item => ({ ...item, type: 'fundraising' }));
      const insightsWithType = (insights || []).map(insight => ({ ...insight, type: 'insights' }));

      setSavedItems({
        grants: grantsWithType,
        fundraising: fundraisingWithType,
        insights: insightsWithType,
      });

      // Set the current grant document if it exists
      if (grantDocs && grantDocs.length > 0) {
        setCurrentGrantDocument(grantDocs[0]);
      }
    } catch (err) {
      console.error('Error fetching saved items:', err);
      setError('Failed to fetch saved items');
    }
  };

  const handleOpenEditor = async (type: 'grant' | 'fundraising' | 'insights', item?: any) => {
    if (!project || !project.id) return;
    
    setEditorType(type);
    
    if (type === 'grant') {
      if (item) {
        // If editing an existing document, fetch the latest version
        const updatedDoc = await grantWriterService.getGrantDocument(item.id);
        setCurrentGrantDocument(updatedDoc);
      } else if (!currentGrantDocument) {
        // Create a new grant document if none exists
        const newDoc = await grantWriterService.createGrantDocument(project.id);
        setCurrentGrantDocument(newDoc);
        // Add the new document to saved items
        setSavedItems(prev => ({
          ...prev,
          grants: [newDoc, ...prev.grants],
        }));
      }
      setEditorItem(item);
    } else {
      setEditorItem(item);
    }
    
    setShowEditor(true);
  };

  const handleGenerateSection = async (sectionId: string) => {
    if (!project || !currentGrantDocument) return;

    try {
      setLoadingStates(prev => ({ ...prev, grantProposal: true }));
      setProgressMessage('Generating section...');

      let response;
      if (sectionId === 'custom_section') {
        // Handle custom section generation
        response = await grantWriterService.generateCustomSection(customPrompt);
      } else {
        switch (sectionId) {
          case 'executive_summary':
            response = await grantWriterService.generateExecutiveSummary();
            break;
          case 'organization_background':
            response = await grantWriterService.generateOrganizationBackground();
            break;
          case 'project_overview':
            response = await grantWriterService.generateProjectOverview();
            break;
          case 'problem_statement':
            response = await grantWriterService.generateProblemStatement();
            break;
          case 'target_population':
            response = await grantWriterService.generateTargetPopulation();
            break;
          case 'methodology':
            response = await grantWriterService.generateMethodology();
            break;
          case 'timeline':
            response = await grantWriterService.generateTimeline();
            break;
          case 'budget':
            response = await grantWriterService.generateBudget();
            break;
          case 'evaluation':
            response = await grantWriterService.generateEvaluation();
            break;
          case 'sustainability':
            response = await grantWriterService.generateSustainability();
            break;
          case 'partnerships':
            response = await grantWriterService.generatePartnerships();
            break;
          case 'capacity':
            response = await grantWriterService.generateCapacity();
            break;
          default:
            throw new Error('Invalid section ID');
        }
      }

      if (response.success) {
        await grantWriterService.updateGrantSection(currentGrantDocument.id, sectionId, response.content);
        setCurrentGrantDocument(await grantWriterService.getGrantDocument(currentGrantDocument.id));
        setProgressMessage('Section generated successfully!');
      } else {
        throw new Error(response.error || 'Failed to generate section');
      }
    } catch (err) {
      console.error('Error generating section:', err);
      setError('Failed to generate section');
      setProgressMessage(null);
    } finally {
      setLoadingStates(prev => ({ ...prev, grantProposal: false }));
    }
  };

  const handleSaveGrantDocument = async (document: GrantDocument) => {
    try {
      const { error } = await supabase
        .from('grant_documents')
        .update({
          sections: document.sections,
          status: document.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', document.id);

      if (error) throw error;
      
      // Update the current document
      setCurrentGrantDocument(document);
      
      // Update the saved items list
      setSavedItems(prev => ({
        ...prev,
        grants: prev.grants.map(grant => 
          grant.id === document.id ? document : grant
        ),
      }));
      
      setSuccessMessage('Grant document saved successfully!');
      setShowEditor(false);
    } catch (err) {
      console.error('Error saving grant document:', err);
      setError('Failed to save grant document');
    }
  };

  const handleGenerateContent = async (prompt: string) => {
    if (!editorType || !project) return;

    try {
      setLoadingStates(prev => ({ ...prev, [editorType === 'grant' ? 'grantProposal' : editorType === 'fundraising' ? 'fundraisingStrategy' : 'insights']: true }));
      setProgressMessage(`Generating ${editorType === 'grant' ? 'grant proposal' : editorType === 'fundraising' ? 'fundraising strategy' : 'project insights'}...`);
      setError(null);

      let response;
      switch (editorType) {
        case 'grant':
          response = await grantWriterService.generateExecutiveSummary();
          break;
        case 'fundraising':
          response = await aiService.analyzeFundraising({ donors: [], projects: [project], events: [] });
          if (response.success) {
            // Structure the fundraising strategy content
            const structuredContent = `# ${project.name} Fundraising Strategy

## Funding Goals
- Target Amount: $${project.budget ? (typeof project.budget === 'string' ? parseFloat(project.budget).toLocaleString() : project.budget.toLocaleString()) : 'TBD'}
- Timeline: 12 months
- Key Milestones:
  - Month 1-3: Initial donor outreach
  - Month 4-6: Major fundraising events
  - Month 7-9: Corporate partnerships
  - Month 10-12: Final push and campaign closure

## Donor Strategy
### Target Donors
- Individual Donors: 60%
- Corporate Sponsors: 30%
- Grant Funding: 10%

### Engagement Plan
${response.content}

## Budget Allocation
| Category | Percentage | Description |
|----------|------------|-------------|
| Marketing | 15% | Digital and print materials |
| Planning | 25% | Fundraising events and donor meetings |
| Staff Time | 40% | Fundraising team activities |
| Technology | 20% | CRM, donation platform, analytics |

### ROI Projections
- Expected Return: $${project.budget ? (typeof project.budget === 'string' ? parseFloat(project.budget) * 1.2 : project.budget * 1.2).toLocaleString() : 'TBD'}
- Cost per Dollar Raised: $0.20
- Timeline to Break Even: 6 months`;

            response = {
              ...response,
              content: structuredContent
            };
          }
          break;
        case 'insights':
          response = await aiService.analyzeProjects([project]);
          break;
        default:
          throw new Error('Invalid editor type');
      }
      
      if (response.success) {
        // Create a new editor item with the generated content
        const newEditorItem = {
          id: editorItem?.id || crypto.randomUUID(),
          title: editorItem?.title || `${project.name} ${editorType === 'grant' ? 'Grant Proposal' : editorType === 'fundraising' ? 'Fundraising Strategy' : 'Project Insights'}`,
          content: response.content,
          type: editorType
        };

        // Update the editor item state
        setEditorItem(newEditorItem);

        // Keep the editor open and in editing mode
        setShowEditor(true);
        setIsEditing(true);
        setProgressMessage(`${editorType === 'grant' ? 'Grant proposal' : editorType === 'fundraising' ? 'Fundraising strategy' : 'Project insights'} generated successfully! Click Save to store your changes.`);
      } else {
        throw new Error(response.error || 'Failed to generate content');
      }
    } catch (err) {
      console.error(`Error generating ${editorType}:`, err);
      setError(`Failed to generate ${editorType}`);
      setProgressMessage(null);
    } finally {
      setLoadingStates(prev => ({ ...prev, [editorType === 'grant' ? 'grantProposal' : editorType === 'fundraising' ? 'fundraisingStrategy' : 'insights']: false }));
    }
  };

  const handleSaveContent = async (title: string, content: string) => {
    if (!editorType || !project) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      let savedItem;
      if (editorItem?.id) {
        // First check if the document exists
        const { data: existingDoc, error: checkError } = await supabase
          .from(editorType === 'insights' ? 'project_content' : 'writing_items')
          .select('id')
          .eq('id', editorItem.id)
          .single();

        if (checkError) {
          // If document doesn't exist, create a new one
          const { data, error } = await supabase
            .from(editorType === 'insights' ? 'project_content' : 'writing_items')
            .insert([
              {
                id: editorItem.id,
                title: title || 'Untitled Document',
                content,
                type: editorType,
                project_id: project.id,
                status: 'draft',
                user_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (error) {
            console.error('Error creating document:', error);
            throw error;
          }
          savedItem = data;
          setSuccessMessage('Document saved successfully!');
        } else {
          // Update existing document
          const { data, error } = await supabase
            .from(editorType === 'insights' ? 'project_content' : 'writing_items')
            .update({
              title: title || 'Untitled Document',
              content,
              updated_at: new Date().toISOString(),
            })
            .eq('id', editorItem.id)
            .select()
            .single();

          if (error) {
            console.error('Error updating document:', error);
            throw error;
          }
          savedItem = data;
          setSuccessMessage('Document updated successfully!');
        }
      } else {
        // Create new item
        if (editorType === 'insights') {
          const { data, error } = await supabase
            .from('project_content')
            .insert([
              {
                project_id: project.id,
                type: 'insights',
                title: title || 'Project Insights',
                content,
                prompt: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (error) {
            console.error('Error creating insights:', error);
            throw error;
          }
          savedItem = data;
          setSuccessMessage('Insights saved successfully!');
        } else {
          // Create new writing item (grant or fundraising)
          const { data, error } = await supabase
            .from('writing_items')
            .insert([
              {
                id: crypto.randomUUID(),
                title: title || 'Untitled Document',
                content,
                type: editorType,
                project_id: project.id,
                status: 'draft',
                user_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (error) {
            console.error('Error creating writing item:', error);
            throw error;
          }
          savedItem = data;
          setSuccessMessage('Document saved successfully!');
        }
      }

      // Update the savedItems state with the new/updated item
      setSavedItems(prev => ({
        ...prev,
        [editorType === 'insights' ? 'insights' : editorType === 'grant' ? 'grants' : 'fundraising']: [
          savedItem,
          ...prev[editorType === 'insights' ? 'insights' : editorType === 'grant' ? 'grants' : 'fundraising'].filter(
            item => item.id !== savedItem.id
          ),
        ],
      }));

      // Update editor state but don't close it
      setEditorItem(savedItem);
      setIsEditing(true);
    } catch (err) {
      console.error('Error saving document:', err instanceof Error ? err.message : 'Unknown error occurred');
      setError(err instanceof Error ? err.message : 'Failed to save document');
    }
  };

  const handleDeleteItem = async (item: any) => {
    try {
      if (item.type === 'grant') {
        // Delete grant document
        const { error } = await supabase
          .from('grant_documents')
          .delete()
          .eq('id', item.id);

        if (error) throw error;

        // Update the UI state
        setSavedItems(prev => ({
          ...prev,
          grants: prev.grants.filter(grant => grant.id !== item.id),
        }));

        // Clear current document if it was deleted
        if (currentGrantDocument?.id === item.id) {
          setCurrentGrantDocument(null);
        }

        // Close the editor if it's open and showing the deleted document
        if (showEditor && editorType === 'grant' && currentGrantDocument?.id === item.id) {
          setShowEditor(false);
          setEditorType(null);
          setEditorItem(null);
        }
      } else {
        // Handle other types of items
        const { error } = await supabase
          .from(item.type === 'insights' ? 'project_content' : 'writing_items')
          .delete()
          .eq('id', item.id);

        if (error) throw error;

        // Update the UI state
        setSavedItems(prev => ({
          ...prev,
          [item.type === 'insights' ? 'insights' : 'fundraising']: 
            prev[item.type === 'insights' ? 'insights' : 'fundraising'].filter(
              savedItem => savedItem.id !== item.id
            ),
        }));

        // Close the editor if it's open and showing the deleted item
        if (showEditor && editorType === item.type && editorItem?.id === item.id) {
          setShowEditor(false);
          setEditorType(null);
          setEditorItem(null);
        }
      }

      setSuccessMessage('Item deleted successfully!');
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
        <button
          onClick={() => router.push('/dashboard/projects')}
          className="text-purple-600 hover:text-purple-800"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/projects')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Projects
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        <p className="text-gray-600 mt-2">{project.description}</p>
      </div>

      {/* Project Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900 capitalize">{project.status}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Budget</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900">${(project.budget || 0).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Timeline</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'} - {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('grants')}
            className={`${
              activeTab === 'grants'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Grants
          </button>
          <button
            onClick={() => setActiveTab('fundraising')}
            className={`${
              activeTab === 'fundraising'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Fundraising
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`${
              activeTab === 'team'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Team
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Project Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Details</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Impact Target</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{project.impact_target}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Impact Metric</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{project.impact_metric}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Team Size</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{project.team_size}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Team Roles</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(project.team_roles || []).map((role: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Project Insights</h2>
                <button
                  onClick={() => handleOpenEditor('insights')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Generate Insights
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Display saved insights */}
              {savedItems.insights.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedItems.insights.map((insight) => (
                    <SavedItemCard
                      key={insight.id}
                      item={insight}
                      onEdit={() => handleOpenEditor('insights', insight)}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </div>
              )}

              {savedItems.insights.length === 0 && (
                <div className="text-center py-12">
                  <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No project insights</h3>
                  <p className="mt-1 text-sm text-gray-500">Generate insights to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'grants' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Grant Proposals</h2>
              <button
                onClick={() => handleOpenEditor('grant')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Create Grant Proposal
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Display saved grant proposals */}
            {savedItems.grants.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedItems.grants.map((proposal) => (
                  <SavedItemCard
                    key={proposal.id}
                    item={proposal}
                    onEdit={() => handleOpenEditor('grant', proposal)}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            )}

            {savedItems.grants.length === 0 && (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No grant proposals</h3>
                <p className="mt-1 text-sm text-gray-500">Create a grant proposal to get started.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fundraising' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Fundraising Strategy</h2>
              <button
                onClick={() => handleOpenEditor('fundraising')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Create Fundraising Strategy
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Display saved fundraising strategies */}
            {savedItems.fundraising.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedItems.fundraising.map((strategy) => (
                  <SavedItemCard
                    key={strategy.id}
                    item={strategy}
                    onEdit={() => handleOpenEditor('fundraising', strategy)}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            )}

            {savedItems.fundraising.length === 0 && (
              <div className="text-center py-12">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No fundraising strategies</h3>
                <p className="mt-1 text-sm text-gray-500">Create a fundraising strategy to get started.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
              <button
                onClick={() => {/* TODO: Implement team member addition */}}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Add Team Member
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(project.team_roles || []).map((role: string, index: number) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <h3 className="text-lg font-medium text-gray-900">{role}</h3>
                  <p className="text-sm text-gray-500 mt-1">Position to be filled</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Replace the DocumentEditor with GrantDocumentEditor */}
      {showEditor && editorType === 'grant' && currentGrantDocument && (
        <GrantDocumentEditor
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setEditorType(null);
            setEditorItem(null);
          }}
          onSave={handleSaveGrantDocument}
          document={currentGrantDocument}
          project={project}
          onGenerateSection={handleGenerateSection}
          isGenerating={loadingStates.grantProposal}
          progressMessage={progressMessage}
        />
      )}

      {/* Keep the original DocumentEditor for fundraising and insights */}
      {showEditor && editorType !== 'grant' && (
        <DocumentEditor
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setEditorType(null);
            setEditorItem(null);
          }}
          onSave={handleSaveContent}
          initialData={editorItem || undefined}
          type={editorType || 'grant'}
          projectName={project?.name || ''}
          onGenerate={handleGenerateContent}
          isGenerating={loadingStates.grantProposal || loadingStates.fundraisingStrategy || loadingStates.insights}
          progressMessage={progressMessage}
          isEditing={isEditing}
        />
      )}

      {/* Add success message display */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}
    </div>
  );
} 