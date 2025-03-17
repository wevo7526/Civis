'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Project } from '@/app/lib/types';
import { PlusIcon, DocumentTextIcon, CalendarIcon, UserGroupIcon, ArrowPathIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { jsPDF } from 'jspdf';

interface WritingItem {
  id: string;
  title: string;
  content: string;
  type: 'grant' | 'fundraising';
  project_id: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface GrantProposalData {
  projectName: string;
  projectDescription: string;
  targetAmount: number;
  projectGoals?: string;
  projectTimeline?: string;
  targetAudience?: string;
  organizationType?: string;
  previousGrants?: string;
  partners?: string;
  impactMetrics?: string;
}

export default function Writing() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [writingItems, setWritingItems] = useState<WritingItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentType, setContentType] = useState<'grant' | 'fundraising'>('grant');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<WritingItem>>({
    title: '',
    content: '',
    type: 'grant',
    project_id: '',
    status: 'draft',
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WritingItem | null>(null);
  const [grantData, setGrantData] = useState<GrantProposalData>({
    projectName: '',
    projectDescription: '',
    targetAmount: 0,
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchProjects();
    fetchWritingItems();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    }
  };

  const fetchWritingItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('writing_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWritingItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch writing items');
    }
  };

  const handleGenerateContent = async () => {
    if (!selectedProject) {
      setError('Please select a project first');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: contentType === 'grant' ? 'generateGrantProposal' : 'generateFundraisingStrategy',
          data: contentType === 'grant' 
            ? {
                projectName: selectedProject.name,
                projectDescription: selectedProject.description,
                targetAmount: selectedProject.budget,
                projectGoals: grantData.projectGoals,
                projectTimeline: grantData.projectTimeline,
                targetAudience: grantData.targetAudience,
                organizationType: grantData.organizationType,
                previousGrants: grantData.previousGrants,
                partners: grantData.partners,
                impactMetrics: grantData.impactMetrics,
              }
            : {
                organizationName: selectedProject.name,
                organizationType: 'Non-Profit',
                targetAmount: selectedProject.budget,
                timeframe: '12 months',
                currentDonors: 'None',
              },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const data = await response.json();
      
      if (!data || (contentType === 'grant' && !data.proposal) || (contentType === 'fundraising' && !data.strategy)) {
        throw new Error('No content was generated');
      }

      const generatedContent = contentType === 'grant' ? data.proposal : data.strategy;

      // Create a new writing item with the generated content
      const newItem = {
        title: contentType === 'grant' ? 'Grant Proposal' : 'Fundraising Strategy',
        content: generatedContent,
        type: contentType,
        project_id: selectedProject.id,
        status: 'draft',
        user_id: user.id,
      };

      console.log('Attempting to save writing item:', newItem);

      // Save to Supabase
      const { data: savedItem, error: saveError } = await supabase
        .from('writing_items')
        .insert([newItem])
        .select()
        .single();

      if (saveError) {
        console.error('Supabase save error:', saveError);
        throw new Error(`Failed to save generated content: ${saveError.message}`);
      }

      if (!savedItem) {
        throw new Error('No item was saved');
      }

      console.log('Successfully saved writing item:', savedItem);

      // Add the new item to the list
      setWritingItems(prev => [...prev, savedItem]);

      // Close the modal
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error generating content:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id) {
      setError('Please select a project first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const newItem: WritingItem = {
        id: Date.now().toString(),
        title: formData.title || '',
        content: formData.content || '',
        type: contentType,
        project_id: formData.project_id,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id,
      };

      console.log('Attempting to save writing item:', newItem);

      const { data: savedItem, error: saveError } = await supabase
        .from('writing_items')
        .insert([newItem])
        .select()
        .single();

      if (saveError) {
        console.error('Supabase save error:', saveError);
        throw new Error(`Failed to save writing item: ${saveError.message}`);
      }

      if (!savedItem) {
        throw new Error('No item was saved');
      }

      console.log('Successfully saved writing item:', savedItem);

      setWritingItems(prev => [...prev, savedItem]);
      setIsModalOpen(false);
      setFormData({
        title: '',
        content: '',
        type: 'grant',
        project_id: '',
        status: 'draft',
      });
    } catch (err) {
      console.error('Error saving writing item:', err);
      setError(err instanceof Error ? err.message : 'Failed to save writing item');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusColor = (status: WritingItem['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const handleDownload = async (content: string, title: string, format: 'docx' | 'pdf' = 'docx') => {
    try {
      if (format === 'docx') {
        // Create a new document
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                text: title,
                heading: HeadingLevel.HEADING_1,
              }),
              ...content.split('\n').map(paragraph => 
                new Paragraph({
                  children: [
                    new TextRun(paragraph),
                  ],
                })
              ),
            ],
          }],
        });

        // Generate the document
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Create PDF
        const doc = new jsPDF();
        const splitTitle = doc.splitTextToSize(title, 180);
        doc.setFontSize(16);
        doc.text(splitTitle, 15, 15);
        
        doc.setFontSize(12);
        const splitContent = doc.splitTextToSize(content, 180);
        doc.text(splitContent, 15, 30);
        
        doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document');
    }
  };

  const handleEditItem = (item: WritingItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!editingItem) return;
    
    try {
      const { error } = await supabase
        .from('writing_items')
        .update({ 
          content: editingItem.content,
          title: editingItem.title,
          status: editingItem.status 
        })
        .eq('id', editingItem.id);
      
      if (error) throw error;
      
      // Update the local state
      setWritingItems(prev => prev.map(item => 
        item.id === editingItem.id ? editingItem : item
      ));
      
      setIsEditModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Error saving changes:', err);
      setError('Failed to save changes');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('writing_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchWritingItems();
    } catch (err) {
      console.error('Error deleting writing item:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete writing item');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Writing</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Writing Item
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Projects List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedProject(project)}
            >
              <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  Budget: ${project.budget.toLocaleString()}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  project.status === 'active' ? 'bg-green-100 text-green-800' :
                  project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Writing Items List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Writing Items</h2>
          <div className="grid grid-cols-1 gap-4">
            {writingItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.content}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'in_review' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditItem(item);
                        }}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="relative group">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const menu = document.getElementById(`download-menu-${item.id}`);
                          if (menu) {
                            menu.classList.toggle('hidden');
                          }
                        }}
                        className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                        title="Download"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <div
                        id={`download-menu-${item.id}`}
                        className="hidden absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                      >
                        <div className="py-1" role="menu">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(item.content, item.title, 'docx');
                              const menu = document.getElementById(`download-menu-${item.id}`);
                              if (menu) {
                                menu.classList.add('hidden');
                              }
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            Download as Word (.docx)
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(item.content, item.title, 'pdf');
                              const menu = document.getElementById(`download-menu-${item.id}`);
                              if (menu) {
                                menu.classList.add('hidden');
                              }
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            Download as PDF (.pdf)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-5xl h-[90vh] bg-white rounded-xl shadow-lg flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex-1">
                <input
                  type="text"
                  value={editingItem?.title || ''}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="text-lg font-medium text-gray-900 bg-transparent border-none focus:ring-0 p-0"
                  placeholder="Enter title"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={editingItem?.status || 'draft'}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, status: e.target.value as WritingItem['status'] } : null)}
                  className="rounded-md border-gray-300 text-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="draft">Draft</option>
                  <option value="in_review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={handleSaveChanges}
                  className="px-3 py-1 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingItem(null);
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
                <div className="prose max-w-none">
                  {editingItem?.content.split('\n').map((paragraph, index) => (
                    <div key={index} className="mb-4">
                      <textarea
                        value={paragraph}
                        onChange={(e) => {
                          if (!editingItem) return;
                          const newContent = editingItem.content.split('\n');
                          newContent[index] = e.target.value;
                          setEditingItem({
                            ...editingItem,
                            content: newContent.join('\n')
                          });
                        }}
                        className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        rows={4}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Writing Item Creation Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Create New Writing Item
              </Dialog.Title>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
                    Project
                  </label>
                  <select
                    id="project_id"
                    required
                    value={formData.project_id}
                    onChange={(e) => {
                      const project = projects.find(p => p.id === e.target.value);
                      setSelectedProject(project || null);
                      setFormData(prev => ({ ...prev, project_id: e.target.value }));
                    }}
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

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="content_type" className="block text-sm font-medium text-gray-700">
                    Content Type
                  </label>
                  <select
                    id="content_type"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'grant' | 'fundraising' }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  >
                    <option value="grant">Grant Proposal</option>
                    <option value="fundraising">Fundraising Strategy</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    required
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as WritingItem['status'] }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                      Content
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateContent}
                      disabled={isGenerating || !formData.project_id}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                      )}
                      Generate with AI
                    </button>
                  </div>
                  <textarea
                    id="content"
                    rows={6}
                    required
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              {formData.type === 'grant' && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900">Grant Proposal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="projectGoals" className="block text-sm font-medium text-gray-700">
                        Project Goals
                      </label>
                      <textarea
                        id="projectGoals"
                        rows={3}
                        value={grantData.projectGoals}
                        onChange={(e) => setGrantData(prev => ({ ...prev, projectGoals: e.target.value }))}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="projectTimeline" className="block text-sm font-medium text-gray-700">
                        Project Timeline
                      </label>
                      <input
                        type="text"
                        id="projectTimeline"
                        value={grantData.projectTimeline}
                        onChange={(e) => setGrantData(prev => ({ ...prev, projectTimeline: e.target.value }))}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">
                        Target Audience
                      </label>
                      <input
                        type="text"
                        id="targetAudience"
                        value={grantData.targetAudience}
                        onChange={(e) => setGrantData(prev => ({ ...prev, targetAudience: e.target.value }))}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="organizationType" className="block text-sm font-medium text-gray-700">
                        Organization Type
                      </label>
                      <input
                        type="text"
                        id="organizationType"
                        value={grantData.organizationType}
                        onChange={(e) => setGrantData(prev => ({ ...prev, organizationType: e.target.value }))}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="previousGrants" className="block text-sm font-medium text-gray-700">
                        Previous Grants
                      </label>
                      <textarea
                        id="previousGrants"
                        rows={3}
                        value={grantData.previousGrants}
                        onChange={(e) => setGrantData(prev => ({ ...prev, previousGrants: e.target.value }))}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="partners" className="block text-sm font-medium text-gray-700">
                        Partners
                      </label>
                      <textarea
                        id="partners"
                        rows={3}
                        value={grantData.partners}
                        onChange={(e) => setGrantData(prev => ({ ...prev, partners: e.target.value }))}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="impactMetrics" className="block text-sm font-medium text-gray-700">
                        Impact Metrics
                      </label>
                      <textarea
                        id="impactMetrics"
                        rows={3}
                        value={grantData.impactMetrics}
                        onChange={(e) => setGrantData(prev => ({ ...prev, impactMetrics: e.target.value }))}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                  disabled={isGenerating}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Creating...' : 'Create Writing Item'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 