'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChartBarIcon, LightBulbIcon, ArrowTrendingUpIcon, DocumentTextIcon, PlusIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Project } from '@/app/lib/types';
import ProjectFundraisingStrategy from './components/ProjectFundraisingStrategy';
import DocumentEditor from '@/app/components/DocumentEditor';
import SavedItemCard from '@/app/components/SavedItemCard';

export default function FundraisingPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [projectName, setProjectName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchProjects();
    fetchSavedItems();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedItems = async () => {
    try {
      const { data, error } = await supabase
        .from('writing_items')
        .select('*')
        .eq('type', 'fundraising')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch strategies');
    }
  };

  const handleEdit = (item: any) => {
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
      setError(err instanceof Error ? err.message : 'Failed to delete strategy');
    }
  };

  const handleDuplicate = async (item: any) => {
    try {
      const { error } = await supabase
        .from('writing_items')
        .insert({
          title: `${item.title} (Copy)`,
          content: item.content,
          type: 'fundraising',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      await fetchSavedItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate strategy');
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
            type: 'fundraising',
            status: 'draft',
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
      setError(err instanceof Error ? err.message : 'Failed to save strategy');
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setProgressMessage('Generating strategy...');
      
      // Implement your AI generation logic here
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProgressMessage('Strategy generated successfully!');
      setIsGenerating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate strategy');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fundraising Strategy</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create and manage your fundraising strategies
              </p>
            </div>
            <button
              onClick={() => {
                setEditingItem(null);
                setProjectName('');
                setIsEditorOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Strategy
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-50 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Strategies</h3>
                <p className="text-2xl font-semibold text-gray-900">{savedItems.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Approved</h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {savedItems.filter(item => item.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">In Review</h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {savedItems.filter(item => item.status === 'in_review').length}
                </p>
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No strategies</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new fundraising strategy.
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
          initialData={editingItem}
          type="fundraising"
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