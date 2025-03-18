'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Project } from '@/lib/types';
import { PlusIcon, DocumentTextIcon, ArrowPathIcon, LightBulbIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import VersionHistory from '@/components/VersionHistory';

interface Document {
  id: string;
  title: string;
  content: string;
  type: 'grant' | 'fundraising';
  project_id: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export default function Writing() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('writing_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    }
  };

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const type = formData.get('type') as 'grant' | 'fundraising';
      const projectId = formData.get('project_id') as string;

      const { data, error } = await supabase
        .from('writing_items')
        .insert([
          {
            title: 'New Document',
            content: '',
            type,
            project_id: projectId || null,
            status: 'draft',
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setDocuments(prev => [data, ...prev]);
      setSelectedDocument(data);
      setIsModalOpen(false);
      setIsEditModalOpen(true);
    } catch (err) {
      console.error('Error creating document:', err);
      setError(err instanceof Error ? err.message : 'Failed to create document');
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedDocument) return;

    try {
      const { error } = await supabase
        .from('writing_items')
        .update({
          title: selectedDocument.title,
          content: selectedDocument.content,
          status: selectedDocument.status,
        })
        .eq('id', selectedDocument.id);

      if (error) throw error;
      setIsEditModalOpen(false);
      fetchDocuments();
    } catch (err) {
      console.error('Error saving changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  const handleGenerateContent = async () => {
    if (!selectedDocument || !prompt.trim()) return;

    try {
      setIsGeneratingContent(true);
      setError(null);

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedDocument.type,
          prompt,
          context: {
            project: projects.find(p => p.id === selectedDocument.project_id),
            document: selectedDocument,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setSelectedDocument(prev => prev ? { ...prev, content: data.content } : null);
      setPrompt('');
    } catch (err) {
      console.error('Error generating content:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleRestoreVersion = async (version: any) => {
    if (!selectedDocument) return;

    try {
      const { error } = await supabase
        .from('writing_items')
        .update({
          content: version.content,
          title: version.title,
        })
        .eq('id', selectedDocument.id);

      if (error) throw error;

      setSelectedDocument(prev => prev ? {
        ...prev,
        content: version.content,
        title: version.title,
      } : null);

      setIsVersionHistoryOpen(false);
    } catch (err) {
      console.error('Error restoring version:', err);
      setError(err instanceof Error ? err.message : 'Failed to restore version');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Document
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-medium text-gray-900">{doc.title}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                doc.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                doc.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {doc.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {doc.type === 'grant' ? 'Grant Proposal' : 'Fundraising Strategy'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedDocument(doc);
                  setIsEditModalOpen(true);
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                <DocumentTextIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setSelectedDocument(doc);
                  setIsVersionHistoryOpen(true);
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                <ClockIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Document Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Create New Document
              </Dialog.Title>
            </div>
            
            <form onSubmit={handleCreateDocument} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Document Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  >
                    <option value="grant">Grant Proposal</option>
                    <option value="fundraising">Fundraising Strategy</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
                    Project (Optional)
                  </label>
                  <select
                    id="project_id"
                    name="project_id"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Create Document
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDocument(null);
          setSuggestions(null);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-4xl h-[90vh] bg-white rounded-xl shadow-lg flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={selectedDocument?.title || ''}
                  onChange={(e) => setSelectedDocument(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="text-lg font-medium text-gray-900 bg-transparent border-none focus:ring-0 p-0"
                  placeholder="Enter title"
                />
                <select
                  value={selectedDocument?.status || 'draft'}
                  onChange={(e) => setSelectedDocument(prev => prev ? { ...prev, status: e.target.value as Document['status'] } : null)}
                  className="rounded-md border-gray-300 text-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="draft">Draft</option>
                  <option value="in_review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedDocument(prev => prev ? { ...prev } : null);
                    setIsVersionHistoryOpen(true);
                  }}
                  className="text-gray-600 hover:text-gray-800"
                  title="View version history"
                >
                  <ClockIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="px-3 py-1 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedDocument(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <div className="h-full p-6 overflow-y-auto">
                <div className="mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Enter your prompt for AI generation..."
                      className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleGenerateContent}
                      disabled={isGeneratingContent || !prompt.trim()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingContent ? (
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      ) : (
                        <LightBulbIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="prose max-w-none">
                  <textarea
                    value={selectedDocument?.content || ''}
                    onChange={(e) => setSelectedDocument(prev => prev ? { ...prev, content: e.target.value } : null)}
                    className="w-full h-full min-h-[500px] p-4 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 resize-none"
                    placeholder="Start writing your content here..."
                  />
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Version History Modal */}
      {selectedDocument && (
        <VersionHistory
          writingItemId={selectedDocument.id}
          isOpen={isVersionHistoryOpen}
          onClose={() => {
            setIsVersionHistoryOpen(false);
            setSelectedDocument(null);
          }}
          onRestoreVersion={handleRestoreVersion}
        />
      )}
    </div>
  );
} 