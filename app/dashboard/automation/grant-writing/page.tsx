'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { DocumentDuplicateIcon, ClockIcon, CheckCircleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { aiService } from '@/lib/aiService';
import { Project, WritingItem } from '@/lib/types';

export default function GrantWriting() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<WritingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<WritingItem | null>(null);
  const [generating, setGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchProjects();
    fetchDocuments();
  }, []);

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
      setError('Failed to fetch projects');
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('writing_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'grant')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProposal = async (projectId: string) => {
    try {
      setGenerating(true);
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Generate proposal using AI
      const response = await aiService.generateGrantProposal(project);

      // Save the proposal to writing_items
      const { data, error } = await supabase
        .from('writing_items')
        .insert([
          {
            title: `${project.name} Grant Proposal`,
            content: response.message,
            type: 'grant',
            project_id: projectId,
            status: 'draft',
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setDocuments(prev => [data, ...prev]);
    } catch (err) {
      console.error('Error generating proposal:', err);
      setError('Failed to generate proposal');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleStatus = async (documentId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'draft' ? 'in_review' : 'draft';
      const { error } = await supabase
        .from('writing_items')
        .update({ status: newStatus })
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev =>
        prev.map(doc =>
          doc.id === documentId ? { ...doc, status: newStatus } : doc
        )
      );
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };

  const handleEdit = (document: WritingItem) => {
    setSelectedDocument(document);
    setEditContent(document.content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedDocument) return;

    try {
      const { error } = await supabase
        .from('writing_items')
        .update({ content: editContent })
        .eq('id', selectedDocument.id);

      if (error) throw error;

      setDocuments(prev =>
        prev.map(doc =>
          doc.id === selectedDocument.id ? { ...doc, content: editContent } : doc
        )
      );
      setIsEditing(false);
      setSelectedDocument(null);
    } catch (err) {
      console.error('Error saving document:', err);
      setError('Failed to save document');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Grant Writing Assistant</h1>
          <p className="text-gray-500">AI-powered grant proposal generation and tracking</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <DocumentDuplicateIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-500">{project.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleGenerateProposal(project.id)}
                disabled={generating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate Proposal'}
              </button>
            </div>
          </div>
        ))}

        {documents.map((document) => (
          <div
            key={document.id}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{document.title}</h3>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      document.status === 'approved' ? 'bg-green-100 text-green-800' :
                      document.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      document.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Created: {new Date(document.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      Updated: {new Date(document.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleToggleStatus(document.id, document.status)}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    document.status === 'draft'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                >
                  {document.status === 'draft' ? 'Submit for Review' : 'Mark as Draft'}
                </button>
                <button
                  onClick={() => handleEdit(document)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </button>
              </div>
            </div>

            {isEditing && selectedDocument?.id === document.id && (
              <div className="mt-4">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-64 p-4 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                />
                <div className="mt-4 flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedDocument(null);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 