'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { DocumentDuplicateIcon, ClockIcon, CheckCircleIcon, PencilIcon, PlusIcon, DocumentTextIcon, BellIcon, SparklesIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { generateGrantProposal } from '../../../lib/aiService';
import { Project } from '../../../lib/types';

interface WritingItem {
  id: string;
  title: string;
  content: string;
  type: string;
  project_id: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface GrantReminder {
  id: string;
  type: 'deadline' | 'progress' | 'report';
  status: 'active' | 'inactive';
  schedule: string;
  template: string;
  lastSent?: string;
  nextSend?: string;
}

export default function Grants() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<WritingItem[]>([]);
  const [reminders, setReminders] = useState<GrantReminder[]>([
    {
      id: 'deadline',
      type: 'deadline',
      status: 'inactive',
      schedule: 'weekly',
      template: 'Reminder: The grant application for ${grant_name} is due on ${deadline}.',
    },
    {
      id: 'progress',
      type: 'progress',
      status: 'inactive',
      schedule: 'monthly',
      template: 'Progress Update: Here\'s how we\'re using the ${grant_name} funding to achieve our goals.',
    },
    {
      id: 'report',
      type: 'report',
      status: 'inactive',
      schedule: 'quarterly',
      template: 'Grant Report: Here\'s our quarterly report on the impact of ${grant_name} funding.',
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<WritingItem | null>(null);
  const [generating, setGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showNewProposalForm, setShowNewProposalForm] = useState(false);
  const [grantPrompt, setGrantPrompt] = useState('');
  const [currentSection, setCurrentSection] = useState('executive_summary');
  const [newProposal, setNewProposal] = useState({
    projectName: '',
    projectDescription: '',
    targetAmount: '',
    organizationInfo: '',
    projectGoals: '',
    projectTimeline: '',
    budgetBreakdown: '',
    evaluationMetrics: '',
    sustainabilityPlan: '',
  });
  const [currentStep, setCurrentStep] = useState(1);
  const supabase = createClientComponentClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchDocuments();
    fetchReminderStatus();
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

  const fetchReminderStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: workflows, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'grant-reminders');

      if (error) throw error;

      // Update reminder statuses based on workflows
      setReminders(prevReminders => 
        prevReminders.map(reminder => {
          const workflow = workflows.find(w => w.config.type === reminder.type);
          return {
            ...reminder,
            status: workflow?.status || 'inactive',
            lastSent: workflow?.last_run,
            nextSend: workflow?.next_run,
          };
        })
      );
    } catch (error) {
      console.error('Error fetching reminder status:', error);
    }
  };

  const handleGenerateProposal = async () => {
    try {
      setGenerating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Create a project object from the prompt
      const project = {
        name: "Grant Proposal",
        description: grantPrompt,
        goals: [],
        budget: 0,
        timeline: "",
      };

      // Generate proposal using AI
      const response = await generateGrantProposal(project);

      // Save the proposal to writing_items
      const { data, error } = await supabase
        .from('writing_items')
        .insert([
          {
            title: "New Grant Proposal",
            content: response.message,
            type: 'grant',
            status: 'draft',
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setDocuments(prev => [data, ...prev]);
      setShowNewProposalForm(false);
      setGrantPrompt('');
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

  const handleToggleReminderStatus = async (reminderId: string) => {
    try {
      const reminder = reminders.find(r => r.id === reminderId);
      if (!reminder) return;

      const newStatus = reminder.status === 'active' ? 'inactive' : 'active';
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update in database
      const { data: workflow, error } = await supabase
        .from('automation_workflows')
        .upsert({
          user_id: user.id,
          type: 'grant-reminders',
          status: newStatus,
          config: {
            type: reminder.type,
            schedule: reminder.schedule,
            template: reminder.template,
          },
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // If activating, start the workflow
      if (newStatus === 'active' && workflow) {
        const response = await fetch('/api/automation/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ workflowId: workflow.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to start workflow');
        }
      }

      // Update local state
      setReminders(prevReminders =>
        prevReminders.map(r =>
          r.id === reminderId ? { ...r, status: newStatus } : r
        )
      );
    } catch (error) {
      console.error('Error toggling reminder status:', error);
      setError('Failed to update reminder status');
    }
  };

  const handleGenerateWithAI = async () => {
    try {
      setIsGenerating(true);
      const project = {
        name: "Grant Proposal",
        description: aiPrompt,
        goals: [],
        budget: 0,
        timeline: "",
      };

      const response = await generateGrantProposal(project);
      setEditorContent(response.message);
    } catch (err) {
      console.error('Error generating with AI:', err);
      setError('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDocument = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data, error } = await supabase
        .from('writing_items')
        .insert([
          {
            title: "New Grant Proposal",
            content: editorContent,
            type: 'grant',
            status: 'draft',
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setDocuments(prev => [data, ...prev]);
      setShowEditor(false);
      setEditorContent('');
      setAiPrompt('');
    } catch (err) {
      console.error('Error saving document:', err);
      setError('Failed to save document');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('writing_items')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
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
          <p className="text-gray-500">AI-powered grant proposal generation and management</p>
        </div>
        <button
          onClick={() => setShowEditor(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <SparklesIcon className="h-5 w-5 mr-2" />
          New Grant Proposal
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Saved Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((document) => (
          <div
            key={document.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900 truncate">{document.title}</h3>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  document.status === 'approved' ? 'bg-green-100 text-green-800' :
                  document.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  document.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="h-32 overflow-hidden text-sm text-gray-600 mb-4">
                {document.content.substring(0, 200)}...
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Updated: {new Date(document.updated_at).toLocaleDateString()}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(document)}
                    className="text-purple-600 hover:text-purple-700"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(document.id, document.status)}
                    className="text-green-600 hover:text-green-700"
                    title={document.status === 'draft' ? 'Submit for Review' : 'Mark as Draft'}
                  >
                    {document.status === 'draft' ? 'Submit' : 'Draft'}
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(document.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grant Automation Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Grant Automation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <BellIcon className="h-5 w-5 text-purple-600" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {reminder.type === 'deadline' ? 'Deadlines' :
                       reminder.type === 'progress' ? 'Progress' : 'Reports'}
                    </h3>
                    <p className="text-xs text-gray-500">{reminder.schedule}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleReminderStatus(reminder.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    reminder.status === 'active'
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {reminder.status === 'active' ? 'On' : 'Off'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50">
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Grant Proposal Editor</h2>
                <button
                  onClick={() => setShowEditor(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex overflow-hidden">
                {/* Editor Section */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    className="w-full h-full p-4 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 resize-none"
                    placeholder="Start writing your grant proposal..."
                  />
                </div>

                {/* AI Assistant Sidebar */}
                <div className="w-80 border-l p-6 overflow-y-auto">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">AI Assistant</h3>
                      <div className="space-y-4">
                        <textarea
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          rows={4}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Ask the AI to help with your grant proposal..."
                        />
                        <button
                          onClick={handleGenerateWithAI}
                          disabled={isGenerating || !aiPrompt.trim()}
                          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                          {isGenerating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="h-4 w-4 mr-2" />
                              Generate with AI
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Writing Tips</h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Start with a compelling executive summary</li>
                        <li>• Clearly state your project goals and objectives</li>
                        <li>• Provide detailed budget breakdown</li>
                        <li>• Include measurable outcomes and impact</li>
                        <li>• Demonstrate organizational capacity</li>
                        <li>• Follow the funder's guidelines closely</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end p-6 border-t">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowEditor(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDocument}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Save Proposal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 