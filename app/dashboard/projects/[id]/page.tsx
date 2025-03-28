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
import type { Project, GrantDocument, GrantSection, FundraisingCampaign } from '@/app/lib/types';
import type { AIResponse as GrantWriterAIResponse } from '@/app/lib/grantWriterService';
import { aiService } from '@/lib/aiService';
import { grantWriterService } from '@/app/lib/grantWriterService';
import SavedItemCard from '../../../components/SavedItemCard';
import GrantDocumentEditor from '../../../components/GrantDocumentEditor';
import DocumentEditor from '../../../components/DocumentEditor';

interface SavedItems {
  grants: any[];
  insights: any[];
}

interface EditorItem {
  id: string;
  title: string;
  content: string;
  type: 'grant' | 'insights' | 'fundraising';
  project_id: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  user_id?: string;
  created_at: string;
  updated_at: string;
  sections?: GrantSection[];
}

type EditorType = 'grant' | 'insights' | 'fundraising';

interface ProjectMetrics {
  progress: number;
  budgetSpent: number;
  impactAchieved: number;
  grantSuccess: number;
  fundraisingProgress: number;
  timelineProgress: number;
  riskScore: number;
  impactProgress: number;
  budgetProgress: number;
}

interface ProjectFormData {
  name: string;
  description: string;
  impact_target: string;
  impact_metric: string;
  start_date: string;
  end_date: string;
  budget: number | string;
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
    insights: boolean;
  }>({
    grantProposal: false,
    insights: false,
  });
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<SavedItems>({
    grants: [],
    insights: [],
  });
  const [showEditor, setShowEditor] = useState(false);
  const [editorType, setEditorType] = useState<EditorType | null>(null);
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
    grantSuccess: 0,
    fundraisingProgress: 0,
    timelineProgress: 0,
    riskScore: 0,
    impactProgress: 0,
    budgetProgress: 0
  });
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    impact_target: '',
    impact_metric: '',
    start_date: '',
    end_date: '',
    budget: 0,
  });
  const [formErrors, setFormErrors] = useState<Partial<ProjectFormData>>({});
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
    try {
      const { data: savedData, error: savedError } = await supabase
        .from('saved_items')
        .select('*')
        .eq('project_id', params.id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (savedError) {
        // If the table doesn't exist, initialize with empty arrays
        if (savedError.message.includes('relation "public.saved_items" does not exist')) {
          setSavedItems({
            grants: [],
            insights: []
          });
          return;
        }
        throw new Error(savedError.message);
      }

      // Transform the data to match the SavedItems interface
      const transformedData: SavedItems = {
        grants: savedData?.filter(item => item.type === 'grant') || [],
        insights: savedData?.filter(item => item.type === 'insights') || []
      };

      setSavedItems(transformedData);
    } catch (err) {
      console.error('Error fetching saved items:', err instanceof Error ? err.message : 'Unknown error');
      setError('Failed to fetch saved items');
      // Initialize with empty arrays on error
      setSavedItems({
        grants: [],
        insights: []
      });
    }
  };

  const handleOpenEditor = async (type: 'grant' | 'fundraising' | 'insights', item?: GrantDocument | FundraisingCampaign) => {
    if (!project || !project.id) return;
    
    setEditorType(type);
    
    if (type === 'grant') {
      if (item && 'sections' in item) { // Type guard for GrantDocument
        // If editing an existing document, use the item directly
        setCurrentGrantDocument(item as GrantDocument);
        const content = (item as GrantDocument).sections.map(s => s.content).join('\n\n');
        setEditorItem({
          ...item,
          type: 'grant',
          content,
        } as EditorItem);
      } else if (!currentGrantDocument) {
        // Create a new grant document
        const newDoc: GrantDocument = {
          id: crypto.randomUUID(),
          project_id: project.id,
          title: `${project.name || 'Project'} Grant Proposal`,
          type: 'standard',
          status: 'draft',
          sections: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setCurrentGrantDocument(newDoc);
        setEditorItem({
          ...newDoc,
          type: 'grant',
          content: '',
        } as EditorItem);
        // Add the new document to saved items
        setSavedItems(prev => ({
          ...prev,
          grants: [newDoc, ...prev.grants],
        }));
      }
    } else if (item) {
      const content = 'content' in item ? item.content : '';
      setEditorItem({
        ...item,
        type: type,
        content,
      } as EditorItem);
    }
    
    setShowEditor(true);
  };

  const handleGenerateSection = async (sectionType: string, customPrompt?: string) => {
    if (!currentGrantDocument || !project) {
      setError('No grant document or project selected');
      return;
    }

    try {
      setLoadingStates(prev => ({ ...prev, grantProposal: true }));
      setProgressMessage('Generating section...');
      setError(null);

      const response = await grantWriterService.generateSection(
        sectionType,
        project,
        customPrompt
      );

      if (response.success && response.content.length > 0) {
        const content = response.content[0].text;
        const newSection: GrantSection = {
          id: crypto.randomUUID(),
          title: sectionType === 'custom' ? 'Custom Section' : sectionType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          content,
          status: 'draft',
          last_updated: new Date().toISOString(),
        };

        const updatedDocument: GrantDocument = {
          ...currentGrantDocument,
          sections: [...currentGrantDocument.sections, newSection],
          updated_at: new Date().toISOString(),
        };

        setCurrentGrantDocument(updatedDocument);
        setSuccessMessage('Section generated successfully!');
      } else {
        setError(response.message || 'Failed to generate section');
      }
    } catch (err) {
      console.error('Error generating section:', err);
      setError('Failed to generate section');
    } finally {
      setLoadingStates(prev => ({ ...prev, grantProposal: false }));
      setProgressMessage(null);
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
      setLoadingStates(prev => ({ ...prev, [editorType === 'grant' ? 'grantProposal' : 'insights']: true }));
      setProgressMessage(`Generating ${editorType === 'grant' ? 'grant proposal' : 'project insights'}...`);
      setError(null);

      let response;
      switch (editorType) {
        case 'grant':
          const projectWithStatus: Project = {
            ...project,
            status: project.status || 'planning' // Provide a default status if not set
          };
          response = await grantWriterService.generateSection('executive_summary', projectWithStatus);
          break;
        case 'insights':
          response = await aiService.analyzeProjects([project]);
          break;
        default:
          throw new Error('Invalid editor type');
      }

      if (!response || !response.success || !response.content) {
        throw new Error('Invalid response from AI service');
      }

      const content = Array.isArray(response.content) 
        ? response.content[0]?.text || ''
        : response.content;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newItem: EditorItem = {
        id: editorItem?.id || crypto.randomUUID(),
        title: editorItem?.title || `${project.name || 'Project'} ${editorType === 'grant' ? 'Grant Proposal' : 'Project Insights'}`,
        content,
        type: editorType,
        project_id: project.id,
        status: 'draft',
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setEditorItem(newItem);
      setShowEditor(true);
      setIsEditing(true);
      setProgressMessage(`${editorType === 'grant' ? 'Grant proposal' : 'Project insights'} generated successfully! Click Save to store your changes.`);
    } catch (err) {
      console.error('Error generating content:', err);
      setError('Failed to generate content');
      setProgressMessage(null);
    } finally {
      setLoadingStates(prev => ({ ...prev, [editorType === 'grant' ? 'grantProposal' : 'insights']: false }));
    }
  };

  const handleSaveContent = async (title: string, content: string) => {
    if (!editorType || !project) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let savedItem;
      if (editorItem?.id) {
        // Update existing item
        const { data, error } = await supabase
          .from(editorType === 'insights' ? 'project_content' : 'grant_documents')
          .update({
            title,
            content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editorItem.id)
          .select()
          .single();

        if (error) throw error;
        savedItem = data;
      } else {
        // Create new item
        const newItem = {
          id: crypto.randomUUID(),
          title: title || 'Untitled Document',
          content,
          type: editorType,
          project_id: project.id,
          status: 'draft',
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from(editorType === 'insights' ? 'project_content' : 'grant_documents')
          .insert([newItem])
          .select()
          .single();

        if (error) throw error;
        savedItem = data;
      }

      // Update the savedItems state
      setSavedItems(prev => ({
        ...prev,
        [editorType === 'insights' ? 'insights' : 'grants']: [
          savedItem,
          ...prev[editorType === 'insights' ? 'insights' : 'grants'].filter(
            item => item.id !== savedItem.id
          ),
        ],
      }));

      // Update editor state
      setEditorItem(savedItem);
      setIsEditing(true);
      setShowEditor(false);
      setEditorType(null);
      setSuccessMessage('Content saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving document:', err);
      setError('Failed to save document');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      // Find the item in savedItems to determine its type
      const item = [...savedItems.grants, ...savedItems.insights]
        .find(item => item.id === itemId);

      if (!item) {
        throw new Error('Item not found');
      }

      if (item.type === 'grant') {
        // Delete grant document
        const { error } = await supabase
          .from('grant_documents')
          .delete()
          .eq('id', itemId);

        if (error) throw error;

        // Update the UI state
        setSavedItems(prev => ({
          ...prev,
          grants: prev.grants.filter(grant => grant.id !== itemId),
        }));

        // Clear current document if it was deleted
        if (currentGrantDocument?.id === itemId) {
          setCurrentGrantDocument(null);
        }

        // Close the editor if it's open and showing the deleted document
        if (showEditor && editorType === 'grant' && currentGrantDocument?.id === itemId) {
          setShowEditor(false);
          setEditorType(null);
          setEditorItem(null);
        }
      } else {
        // Handle other types of items
        const { error } = await supabase
          .from(item.type === 'insights' ? 'project_content' : 'grant_documents')
          .delete()
          .eq('id', itemId);

        if (error) throw error;

        // Update the UI state
        setSavedItems(prev => ({
          ...prev,
          [item.type === 'insights' ? 'insights' : 'grants']: 
            prev[item.type === 'insights' ? 'insights' : 'grants'].filter(
              savedItem => savedItem.id !== itemId
            ),
        }));

        // Close the editor if it's open and showing the deleted item
        if (showEditor && editorType === item.type && editorItem?.id === itemId) {
          setShowEditor(false);
          setEditorType(null);
          setEditorItem(null);
        }
      }

      setSuccessMessage('Item deleted successfully!');
    } catch (err) {
      console.error('Error deleting item:', err instanceof Error ? err.message : 'Unknown error occurred');
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const handleEditProject = () => {
    if (!project) return;
    setFormData({
      name: project.name || '',
      description: project.description || '',
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
    const errors: Partial<ProjectFormData> = {};
    
    if (!formData.name || typeof formData.name !== 'string' || !formData.name.trim()) {
      errors.name = 'Project name is required';
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
        status: project.status || 'planning'
      });
      setIsEditingProject(false);
      setFormData({
        name: '',
        description: '',
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

  // Update the calculateMetrics function
  const calculateMetrics = async () => {
    try {
      // Fetch grant documents
      const { data: grantData, error: grantError } = await supabase
        .from('grant_documents')
        .select('*')
        .eq('project_id', params.id);

      if (grantError) {
        // If the table doesn't exist, initialize with default metrics
        if (grantError.message.includes('relation "public.grant_documents" does not exist')) {
          setMetrics(prev => ({
            ...prev,
            timelineProgress: 0,
            grantSuccess: 0,
            fundraisingProgress: 0,
            riskScore: 0
          }));
          return;
        }
        throw new Error(grantError.message);
      }

      // Calculate metrics based on grant data
      const totalGrants = grantData?.length || 0;
      const totalAmount = grantData?.reduce((sum, grant) => sum + (grant.amount || 0), 0) || 0;
      const averageAmount = totalGrants > 0 ? totalAmount / totalGrants : 0;
      const successRate = totalGrants > 0 ? (grantData?.filter(g => g.status === 'approved').length / totalGrants) * 100 : 0;

      setMetrics(prev => ({
        ...prev,
        timelineProgress: 0,
        grantSuccess: successRate,
        fundraisingProgress: 0,
        riskScore: 0
      }));
    } catch (err) {
      console.error('Error calculating metrics:', err instanceof Error ? err.message : 'Unknown error');
      setError('Failed to calculate project metrics');
      // Initialize with default metrics on error
      setMetrics(prev => ({
        ...prev,
        timelineProgress: 0,
        grantSuccess: 0,
        fundraisingProgress: 0,
        riskScore: 0
      }));
    }
  };

  // Add useEffect to calculate metrics when project changes
  useEffect(() => {
    if (project) {
      calculateMetrics();
    }
  }, [project]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Timeline Progress */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Timeline Progress</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{Math.round(metrics.timelineProgress)}%</p>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${metrics.timelineProgress}%` }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {formatDate(project.start_date)} - {formatDate(project.end_date)}
              </p>
            </div>
          </div>

          {/* Budget Progress */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Budget Progress</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">${metrics.budgetSpent.toLocaleString()}</p>
              <p className="mt-1 text-sm text-gray-500">of ${(project.budget ?? 0).toLocaleString()}</p>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    metrics.budgetProgress > 90 ? 'bg-red-600' : metrics.budgetProgress > 75 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${metrics.budgetProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Impact Progress */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Impact Progress</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{Math.round(metrics.impactProgress)}%</p>
              <p className="mt-1 text-sm text-gray-500">of {project.impact_target} {project.impact_metric}</p>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${metrics.impactProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Risk Score */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                metrics.riskScore > 75 ? 'bg-red-100' : metrics.riskScore > 50 ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                <ChartPieIcon className={`h-6 w-6 ${
                  metrics.riskScore > 75 ? 'text-red-600' : metrics.riskScore > 50 ? 'text-yellow-600' : 'text-green-600'
                }`} />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Project Health</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{Math.round(100 - metrics.riskScore)}%</p>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    metrics.riskScore > 75 ? 'bg-red-600' : metrics.riskScore > 50 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${metrics.riskScore}%` }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {metrics.riskScore > 75 ? 'High Risk' : metrics.riskScore > 50 ? 'Medium Risk' : 'Low Risk'}
              </p>
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
              <div className="space-y-6">
                {isEditingProject ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveProject();
                  }}>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Grant Success Section */}
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-purple-700">Grant Performance</h3>
                        <DocumentTextIcon className="h-5 w-5 text-purple-500" />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-purple-600">Success Rate</span>
                            <span className="text-sm font-medium text-purple-900">{Math.round(metrics.grantSuccess)}%</span>
                          </div>
                          <div className="w-full bg-purple-100 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${metrics.grantSuccess}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-sm text-purple-600">
                          {savedItems.grants.length} grant proposals
                        </div>
                        <div className="text-sm text-purple-600">
                          {savedItems.grants.filter(grant => grant.status === 'approved').length} successful grants
                        </div>
                      </div>
                    </div>

                    {/* Grant Insights Section */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-blue-700">Grant Insights</h3>
                        <ChartPieIcon className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="space-y-4">
                        <div className="text-sm text-blue-600">
                          {savedItems.grants.length > 0 ? (
                            <div>
                              <p>• {savedItems.grants.filter(grant => grant.status === 'approved').length} successful grants</p>
                              <p>• {savedItems.grants.filter(grant => grant.status === 'rejected').length} unsuccessful grants</p>
                              <p>• {savedItems.grants.filter(grant => grant.status === 'pending').length} pending review</p>
                            </div>
                          ) : (
                            <p>No grant proposals yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
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
                      onDuplicate={() => handleOpenEditor('insights', { ...insight, title: `${insight.title} (Copy)` })}
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
                    onDuplicate={() => handleOpenEditor('grant', { ...proposal, title: `${proposal.title} (Copy)` })}
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
          isGenerating={loadingStates.grantProposal || loadingStates.insights}
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