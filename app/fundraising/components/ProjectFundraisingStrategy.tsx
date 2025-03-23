'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Project } from '@/app/lib/types';
import DocumentEditor from '@/app/components/DocumentEditor';
import SavedItemCard from '@/app/components/SavedItemCard';
import { aiService } from '@/app/lib/aiService';

interface ProjectFundraisingStrategyProps {
  project: Project;
}

export default function ProjectFundraisingStrategy({ project }: ProjectFundraisingStrategyProps) {
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editorItem, setEditorItem] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    fundraisingStrategy: false
  });
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
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

  const handleOpenEditor = (item?: any) => {
    setEditorItem(item);
    setShowEditor(true);
    setIsEditing(!!item);
  };

  const handleGenerateContent = async (prompt: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, fundraisingStrategy: true }));
      setProgressMessage('Generating fundraising strategy...');
      setError(null);

      const response = await aiService.generateFundraisingStrategy(project);
      
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

        response.content = structuredContent;
      }

      const newEditorItem = {
        id: editorItem?.id || crypto.randomUUID(),
        title: editorItem?.title || `${project.name || 'Project'} Fundraising Strategy`,
        content: response.content,
        type: 'fundraising'
      };

      setEditorItem(newEditorItem);
      setShowEditor(true);
      setIsEditing(true);
      setProgressMessage('Fundraising strategy generated successfully! Click Save to store your changes.');
    } catch (err) {
      console.error('Error generating fundraising strategy:', err);
      setError('Failed to generate fundraising strategy');
      setProgressMessage(null);
    } finally {
      setLoadingStates(prev => ({ ...prev, fundraisingStrategy: false }));
    }
  };

  const handleSaveContent = async (title: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let savedItem;
      if (editorItem?.id) {
        // Update existing writing item
        const { data, error } = await supabase
          .from('writing_items')
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
        // Create new writing item
        const { data, error } = await supabase
          .from('writing_items')
          .insert([
            {
              id: crypto.randomUUID(),
              title: title || 'Untitled Document',
              content,
              type: 'fundraising',
              project_id: project.id,
              status: 'draft',
              user_id: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;
        savedItem = data;
      }

      // Update the savedItems state
      setSavedItems(prev => [
        savedItem,
        ...prev.filter(item => item.id !== savedItem.id),
      ]);

      // Update editor state
      setEditorItem(savedItem);
      setIsEditing(true);
    } catch (err) {
      console.error('Error saving document:', err);
      setError('Failed to save document');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('writing_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setSavedItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
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
          onGenerate={handleGenerateContent}
          isGenerating={loadingStates.fundraisingStrategy}
          progressMessage={progressMessage}
          isEditing={isEditing}
        />
      )}
    </div>
  );
} 