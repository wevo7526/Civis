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
  ArrowLeftIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ChartPieIcon,
  CurrencyDollarIcon,
  TagIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import type { Project } from '@/app/lib/types';
import { aiService } from '@/lib/aiService';
import { grantWriterService, GrantDocument, GrantSection } from '@/app/lib/grantWriterService';
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

interface ProjectMetrics {
  progress: number;
  budgetSpent: number;
  impactAchieved: number;
  teamEfficiency: number;
}

interface ProjectFormData {
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'on_hold';
  impact_target: string;
  impact_metric: string;
  start_date: string;
  end_date: string;
  budget: number | string;
}

interface FormErrors {
  name?: string;
  status?: string;
  impact_target?: string;
  impact_metric?: string;
  start_date?: string;
  end_date?: string;
  budget?: string;
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
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editedProject, setEditedProject] = useState<Partial<Project> | null>(null);
  const [metrics, setMetrics] = useState<ProjectMetrics>({
    progress: 0,
    budgetSpent: 0,
    impactAchieved: 0,
    teamEfficiency: 0,
  });
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'planning',
    impact_target: '',
    impact_metric: '',
    start_date: '',
    end_date: '',
    budget: 0,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
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
        // If editing an existing document, use the item directly
        setCurrentGrantDocument(item);
      } else if (!currentGrantDocument) {
        // Create a new grant document
        const newDoc: GrantDocument = {
          id: crypto.randomUUID(),
          project_id: project.id,
          title: `${project.name || 'Project'} Grant Proposal`,
          sections: [],
          status: 'draft',
          type: 'standard',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
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
        // Use the generic generateSection method
        const projectWithStatus = {
          ...project,
          status: project.status || 'planning' // Provide a default status if not set
        };
        response = await grantWriterService.generateSection(sectionId, projectWithStatus);
      }

      if (response.success) {
        // Update the document with the new section
        const updatedDoc: GrantDocument = {
          ...currentGrantDocument,
          sections: [
            ...currentGrantDocument.sections,
            {
              id: crypto.randomUUID(),
              title: sectionId,
              content: response.content,
              status: 'generated' as const,
              lastUpdated: new Date().toISOString(),
            },
          ],
          updatedAt: new Date().toISOString(),
        };
        setCurrentGrantDocument(updatedDoc);
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
      await grantWriterService.saveDocument(document);
      
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
          const projectWithStatus = {
            ...project,
            status: project.status || 'planning' // Provide a default status if not set
          };
          response = await grantWriterService.generateSection('executive_summary', projectWithStatus);
          break;
        case 'fundraising':
          response = await aiService.analyzeFundraising({ donors: [], projects: [project], events: [] });
          if (response.success) {
            // Structure the fundraising strategy content
            const structuredContent = `# ${project.name || 'Project'} Fundraising Strategy

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
          title: editorItem?.title || `${project.name || 'Project'} ${editorType === 'grant' ? 'Grant Proposal' : editorType === 'fundraising' ? 'Fundraising Strategy' : 'Project Insights'}`,
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

  const handleEditProject = () => {
    if (!project) return;
    setFormData({
      name: project.name || '',
      description: project.description || '',
      status: project.status || 'planning',
      impact_target: project.impact_target || '',
      impact_metric: project.impact_metric || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      budget: typeof project.budget === 'number' ? project.budget : 0,
    });
    setIsEditingProject(true);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.name || typeof formData.name !== 'string' || !formData.name.trim()) {
      errors.name = 'Project name is required';
    }
    
    if (!formData.status) {
      errors.status = 'Please select a status';
    }
    
    if (!formData.impact_target || typeof formData.impact_target !== 'string' || !formData.impact_target.trim()) {
      errors.impact_target = 'Impact target is required';
    }
    
    if (!formData.impact_metric || typeof formData.impact_metric !== 'string' || !formData.impact_metric.trim()) {
      errors.impact_metric = 'Impact metric is required';
    }
    
    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
    }
    
    if (!formData.end_date) {
      errors.end_date = 'End date is required';
    }
    
    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      errors.end_date = 'End date must be after start date';
    }
    
    const budgetValue = typeof formData.budget === 'string' ? parseFloat(formData.budget) : formData.budget;
    if (isNaN(budgetValue) || budgetValue < 0) {
      errors.budget = 'Budget must be a positive number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProject = async () => {
    if (!project || !validateForm()) return;

    try {
      const budgetValue = typeof formData.budget === 'string' ? parseFloat(formData.budget) : formData.budget;

      const { error } = await supabase
        .from('projects')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim(),
          status: formData.status,
          impact_target: formData.impact_target.trim(),
          impact_metric: formData.impact_metric.trim(),
          start_date: formData.start_date,
          end_date: formData.end_date,
          budget: budgetValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (error) throw error;

      setProject({ 
        ...project, 
        ...formData,
        budget: budgetValue,
      });
      setIsEditingProject(false);
      setFormData({
        name: '',
        description: '',
        status: 'planning',
        impact_target: '',
        impact_metric: '',
        start_date: '',
        end_date: '',
        budget: 0,
      });
      setFormErrors({});
      setSuccessMessage('Project updated successfully!');
    } catch (err) {
      setError('Failed to update project');
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProject(false);
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      impact_target: '',
      impact_metric: '',
      start_date: '',
      end_date: '',
      budget: 0,
    });
    setFormErrors({});
  };

  // Add type guard for date strings
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
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
      {/* Header Section */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/projects')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Projects
        </button>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-2">{project.description}</p>
        </div>
      </div>

      {/* Project Status and Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <ChartPieIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Progress</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics.progress}%</p>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${metrics.progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Budget Spent</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">${metrics.budgetSpent.toLocaleString()}</p>
              <p className="mt-1 text-sm text-gray-500">of ${(project.budget ?? 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TagIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Impact Achieved</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics.impactAchieved}%</p>
              <p className="mt-1 text-sm text-gray-500">of {project.impact_target}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <ArrowTrendingUpIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Team Efficiency</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics.teamEfficiency}%</p>
              <p className="mt-1 text-sm text-gray-500">based on milestones</p>
            </div>
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
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Project Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Project Details</h2>
                {!isEditingProject && (
                  <button
                    onClick={handleEditProject}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Edit Project
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {isEditingProject ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveProject();
                  }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Project Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm ${
                            formErrors.name ? 'border-red-300' : ''
                          }`}
                        />
                        {formErrors.name && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          id="status"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm ${
                            formErrors.status ? 'border-red-300' : ''
                          }`}
                        >
                          <option value="planning">Planning</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="on_hold">On Hold</option>
                        </select>
                        {formErrors.status && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.status}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="impact_target" className="block text-sm font-medium text-gray-700">
                          Impact Target
                        </label>
                        <input
                          type="text"
                          id="impact_target"
                          value={formData.impact_target}
                          onChange={(e) => setFormData({ ...formData, impact_target: e.target.value })}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm ${
                            formErrors.impact_target ? 'border-red-300' : ''
                          }`}
                        />
                        {formErrors.impact_target && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.impact_target}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="impact_metric" className="block text-sm font-medium text-gray-700">
                          Impact Metric
                        </label>
                        <input
                          type="text"
                          id="impact_metric"
                          value={formData.impact_metric}
                          onChange={(e) => setFormData({ ...formData, impact_metric: e.target.value })}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm ${
                            formErrors.impact_metric ? 'border-red-300' : ''
                          }`}
                        />
                        {formErrors.impact_metric && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.impact_metric}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                          Start Date
                        </label>
                        <input
                          type="date"
                          id="start_date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm ${
                            formErrors.start_date ? 'border-red-300' : ''
                          }`}
                        />
                        {formErrors.start_date && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.start_date}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                          End Date
                        </label>
                        <input
                          type="date"
                          id="end_date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm ${
                            formErrors.end_date ? 'border-red-300' : ''
                          }`}
                        />
                        {formErrors.end_date && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.end_date}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                          Budget
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="budget"
                            value={formData.budget}
                            onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="0.01"
                            className={`block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm ${
                              formErrors.budget ? 'border-red-300' : ''
                            }`}
                          />
                        </div>
                        {formErrors.budget && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.budget}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Impact Target</h3>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{project.impact_target}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Impact Metric</h3>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{project.impact_metric}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Timeline</h3>
                      <div className="mt-2 flex items-center text-gray-900">
                        <CalendarIcon className="h-5 w-5 mr-2" />
                        <span>
                          {formatDate(project.start_date)} - {formatDate(project.end_date)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Budget</h3>
                      <div className="mt-2 flex items-center text-gray-900">
                        <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                        <span>${(typeof project.budget === 'number' ? project.budget : 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}
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