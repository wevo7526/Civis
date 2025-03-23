'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChartBarIcon, LightBulbIcon, ArrowTrendingUpIcon, DocumentTextIcon, PlusIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Project } from '@/app/lib/types';
import DocumentEditor from '@/app/components/DocumentEditor';
import SavedItemCard from '@/app/components/SavedItemCard';

interface WritingItem {
  id: string;
  title: string;
  content: string;
  type: 'insights' | 'grant' | 'fundraising';
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  project_id: string;
  created_at: string;
  updated_at: string;
}

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<WritingItem[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WritingItem | null>(null);
  const [projectName, setProjectName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchProject();
    fetchSavedItems();
  }, [params.id]);

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
      const { data, error } = await supabase
        .from('writing_items')
        .select('*')
        .eq('type', 'insights')
        .eq('project_id', params.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    }
  };

  const handleSave = async (title: string, content: string) => {
    try {
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('writing_items')
          .update({
            title,
            content,
            updated_at: new Date().toISOString(),
            project_id: params.id,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        // Create new item
        const { error } = await supabase
          .from('writing_items')
          .insert({
            title,
            content,
            type: 'insights',
            status: 'draft',
            project_id: params.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      // Refresh the list
      await fetchSavedItems();
      setIsEditorOpen(false);
      setEditingItem(null);
      setProjectName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save insight');
    }
  };

  const handleEdit = (item: WritingItem) => {
    setEditingItem(item);
    setProjectName(item.title || '');
    setIsEditorOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('writing_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchSavedItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete insight');
    }
  };

  const handleDuplicate = async (item: WritingItem) => {
    try {
      const { error } = await supabase
        .from('writing_items')
        .insert({
          title: `${item.title} (Copy)`,
          content: item.content,
          type: 'insights',
          status: 'draft',
          project_id: params.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      await fetchSavedItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate insight');
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setProgressMessage('Generating insight...');
      
      // Implement your AI generation logic here
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProgressMessage('Insight generated successfully!');
      setIsGenerating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insight');
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Project not found</h1>
          <p className="mt-2 text-gray-600">The project you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="mt-1 text-sm text-gray-500">{project.description}</p>
            </div>
            <button
              onClick={() => {
                setEditingItem(null);
                setProjectName('');
                setIsEditorOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              New Insight
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Insights</dt>
                    <dd className="text-lg font-semibold text-gray-900">{savedItems.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Approved Insights</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {savedItems.filter(item => item.status === 'approved').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">In Review</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {savedItems.filter(item => item.status === 'in_review').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {savedItems.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <DocumentTextIcon className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No insights</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new project insight.
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedItems.map((item) => (
                  <SavedItemCard
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDeleteItem}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <DocumentEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingItem(null);
            setProjectName('');
          }}
          onSave={handleSave}
          initialData={editingItem || undefined}
          type="insights"
          projectName={projectName}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          progressMessage={progressMessage}
          isEditing={!!editingItem}
        />
      )}
    </div>
  );
} 