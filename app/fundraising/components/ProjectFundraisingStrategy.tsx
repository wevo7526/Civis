'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Project, WritingItem } from '@/app/lib/types';
import DocumentEditor from '@/app/components/DocumentEditor';
import SavedItemCard from '@/app/components/SavedItemCard';
import { aiService } from '@/lib/aiService';
import { toast } from 'react-hot-toast';
import { AIResponse } from '@/lib/types';

interface ProjectFundraisingStrategyProps {
  project: Project;
}

export default function ProjectFundraisingStrategy({ project }: ProjectFundraisingStrategyProps) {
  const [savedItems, setSavedItems] = useState<WritingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editorItem, setEditorItem] = useState<WritingItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    fundraisingStrategy: false
  });
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<string>('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchSavedItems();
  }, [project.id]);

  const fetchSavedItems = async () => {
    try {
      const { data, error } = await supabase
        .from('writing_items')
        .select('*')
        .eq('project_id', project.id)
        .eq('type', 'fundraising')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch fundraising strategies');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditor = (item?: WritingItem) => {
    setEditorItem(item || null);
    setIsEditing(!!item);
    setShowEditor(true);
  };

  const handleGenerateStrategy = async () => {
    if (!project) return;

    try {
      setIsGenerating(true);
      setError(null);
      setProgressMessage('Generating fundraising strategy...');

      const response = await aiService.analyzeFundraising({
        donors: [], // We'll add donor data later if needed
        projects: [project],
        events: [] // We'll add event data later if needed
      });

      if (!response.success) {
        throw new Error(response.message ?? 'Failed to generate fundraising strategy');
      }

      const content = Array.isArray(response.content) 
        ? response.content[0]?.text || ''
        : response.content;

      setStrategy(content);
      setSuccessMessage('Strategy generated successfully!');
    } catch (err) {
      console.error('Error generating strategy:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate strategy');
    } finally {
      setIsGenerating(false);
      setProgressMessage(null);
    }
  };

  const handleSaveContent = async (title: string, content: string) => {
    try {
      const item: Omit<WritingItem, 'id' | 'created_at' | 'updated_at'> = {
        title,
        content,
        type: 'fundraising',
        project_id: project.id,
        status: 'draft'
      };

      if (isEditing && editorItem?.id) {
        const { error } = await supabase
          .from('writing_items')
          .update({
            title,
            content,
            updated_at: new Date().toISOString()
          })
          .eq('id', editorItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('writing_items')
          .insert([item]);

        if (error) throw error;
      }

      await fetchSavedItems();
      setShowEditor(false);
      setEditorItem(null);
      setIsEditing(false);
      toast.success(isEditing ? 'Strategy updated successfully' : 'Strategy saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save fundraising strategy');
      toast.error('Failed to save fundraising strategy');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('writing_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      await fetchSavedItems();
      toast.success('Strategy deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete fundraising strategy');
      toast.error('Failed to delete fundraising strategy');
    }
  };

  const handleDuplicateStrategy = async (strategy: WritingItem) => {
    try {
      const { error } = await supabase
        .from('writing_items')
        .insert([{
          title: `${strategy.title} (Copy)`,
          content: strategy.content,
          type: 'fundraising',
          project_id: project.id,
          status: 'draft'
        }]);

      if (error) throw error;
      await fetchSavedItems();
      toast.success('Strategy duplicated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate fundraising strategy');
      toast.error('Failed to duplicate fundraising strategy');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fundraising Strategy</h2>
          <p className="mt-1 text-sm text-gray-500">Manage and create fundraising strategies for your project</p>
        </div>
        <button
          onClick={() => handleOpenEditor()}
          className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
        >
          <ChartBarIcon className="h-5 w-5 mr-2" />
          Create New Strategy
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {savedItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedItems.map((strategy) => (
            <SavedItemCard
              key={strategy.id}
              item={strategy}
              onEdit={() => handleOpenEditor(strategy)}
              onDelete={handleDeleteItem}
              onDuplicate={() => handleDuplicateStrategy(strategy)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No fundraising strategies yet</h3>
          <p className="mt-2 text-sm text-gray-500">Get started by creating your first fundraising strategy.</p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenEditor()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Create Strategy
            </button>
          </div>
        </div>
      )}

      {showEditor && (
        <DocumentEditor
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setEditorItem(null);
          }}
          onSave={handleSaveContent}
          initialData={editorItem || undefined}
          type="fundraising"
          projectName={project.name || ''}
          onGenerate={handleGenerateStrategy}
          isGenerating={loadingStates.fundraisingStrategy}
          progressMessage={progressMessage}
          isEditing={isEditing}
        />
      )}

      {successMessage && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      {progressMessage && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-md">
          {progressMessage}
        </div>
      )}

      {strategy && (
        <div className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: strategy }} />
        </div>
      )}
    </div>
  );
} 