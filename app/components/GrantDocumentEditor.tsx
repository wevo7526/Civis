import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  DocumentTextIcon, 
  PencilIcon, 
  EyeIcon,
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  QueueListIcon,
  ChatBubbleLeftIcon,
  CodeBracketIcon,
  DocumentCheckIcon,
  SparklesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GrantSection, GrantDocument } from '@/app/lib/types';
import { Project } from '@/app/lib/types';
import { grantWriterService, AIResponse } from '@/app/lib/grantWriterService';

interface GrantSectionTemplate {
  id: string;
  title: string;
  description: string;
  required: boolean;
}

const GRANT_SECTIONS: GrantSectionTemplate[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    description: 'A concise overview of the project, its goals, and expected impact',
    required: true,
  },
  {
    id: 'organization_background',
    title: 'Organization Background & Mission',
    description: 'History, mission, and track record of the organization',
    required: true,
  },
  {
    id: 'project_overview',
    title: 'Project Overview & Goals',
    description: 'Detailed description of the project and its objectives',
    required: true,
  },
  {
    id: 'problem_statement',
    title: 'Problem Statement & Need',
    description: 'Clear articulation of the problem and why this project is needed',
    required: true,
  },
  {
    id: 'target_population',
    title: 'Target Population & Impact',
    description: 'Description of beneficiaries and expected impact',
    required: true,
  },
  {
    id: 'methodology',
    title: 'Project Design & Methodology',
    description: 'Detailed approach to implementing the project',
    required: true,
  },
  {
    id: 'timeline',
    title: 'Timeline & Milestones',
    description: 'Project schedule and key milestones',
    required: true,
  },
  {
    id: 'budget',
    title: 'Budget & Resource Allocation',
    description: 'Detailed budget breakdown and resource requirements',
    required: true,
  },
  {
    id: 'evaluation',
    title: 'Evaluation & Success Metrics',
    description: 'How project success will be measured and evaluated',
    required: true,
  },
  {
    id: 'sustainability',
    title: 'Sustainability Plan',
    description: 'How the project will be sustained beyond the grant period',
    required: true,
  },
  {
    id: 'partnerships',
    title: 'Partnerships & Collaborations',
    description: 'Key partners and their roles in the project',
    required: false,
  },
  {
    id: 'capacity',
    title: 'Organizational Capacity',
    description: 'Organization\'s ability to implement the project',
    required: true,
  },
];

const getSectionStatusIcon = (status: GrantSection['status']) => {
  switch (status) {
    case 'approved':
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    case 'draft':
      return <PencilIcon className="h-4 w-4 text-yellow-500" />;
    case 'in_review':
      return <ClockIcon className="h-4 w-4 text-blue-500" />;
    case 'rejected':
      return <XCircleIcon className="h-4 w-4 text-red-500" />;
    default:
      return <ClockIcon className="h-4 w-4 text-gray-400" />;
  }
};

interface GrantDocumentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  document: GrantDocument;
  project: Project;
  onSave: (document: GrantDocument) => Promise<void>;
  onGenerateSection: (sectionId: string, customPrompt?: string) => Promise<void>;
  isGenerating: boolean;
  progressMessage?: string | null;
}

const SECTION_TEMPLATES = {
  executive_summary: `## Executive Summary

[Your project summary here]

### Key Points
- Project Overview
- Mission Alignment
- Expected Impact
- Funding Request
- Timeline`,

  organization_background: `## Organization Background & Mission

### History
[Organization's history and evolution]

### Mission Statement
[Organization's mission statement]

### Track Record
- Previous Successes
- Key Achievements
- Community Impact`,

  project_overview: `## Project Overview & Goals

### Primary Goals
1. [Goal 1]
2. [Goal 2]
3. [Goal 3]

### Measurable Objectives
- Objective 1: [Description]
- Objective 2: [Description]
- Objective 3: [Description]

### Success Metrics
- Metric 1: [Description]
- Metric 2: [Description]
- Metric 3: [Description]`,

  problem_statement: `## Problem Statement & Need

### Current Situation
[Description of the current problem]

### Impact of the Problem
- Impact 1
- Impact 2
- Impact 3

### Why This Project is Needed
[Explanation of why this project addresses the problem]`,

  target_population: `## Target Population & Impact

### Beneficiaries
[Description of who will benefit]

### Demographics
- Age Range
- Geographic Location
- Other Relevant Factors

### Expected Impact
1. [Impact 1]
2. [Impact 2]
3. [Impact 3]`,

  methodology: `## Project Design & Methodology

### Approach
[Description of the project approach]

### Implementation Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Resources Required
- Human Resources
- Equipment
- Materials
- Other Resources`,

  timeline: `## Timeline & Milestones

### Phase 1: [Name]
- Start Date: [Date]
- End Date: [Date]
- Key Activities:
  1. [Activity 1]
  2. [Activity 2]
  3. [Activity 3]

### Phase 2: [Name]
- Start Date: [Date]
- End Date: [Date]
- Key Activities:
  1. [Activity 1]
  2. [Activity 2]
  3. [Activity 3]`,

  budget: `## Budget & Resource Allocation

### Budget Breakdown
| Category | Amount | Description | Justification |
|----------|---------|-------------|---------------|
| [Category] | $[Amount] | [Description] | [Justification] |

### Budget Narrative
[Detailed explanation of budget items and their necessity]`,

  evaluation: `## Evaluation & Success Metrics

### Evaluation Plan
[Description of how the project will be evaluated]

### Success Metrics
1. [Metric 1]
2. [Metric 2]
3. [Metric 3]

### Data Collection
- Methods
- Timeline
- Analysis Plan`,

  sustainability: `## Sustainability Plan

### Long-term Strategy
[Description of how the project will be sustained]

### Funding Sources
1. [Source 1]
2. [Source 2]
3. [Source 3]

### Partnerships
[Description of key partnerships for sustainability]`,

  partnerships: `## Partnerships & Collaborations

### Key Partners
1. [Partner 1]
   - Role
   - Contribution
   - Benefits

2. [Partner 2]
   - Role
   - Contribution
   - Benefits`,

  capacity: `## Organizational Capacity

### Staff & Expertise
[Description of staff capabilities]

### Infrastructure
- Facilities
- Equipment
- Technology

### Experience
[Description of relevant experience]`,
};

export default function GrantDocumentEditor({
  isOpen,
  onClose,
  document: initialDocument,
  project,
  onSave,
  onGenerateSection,
  isGenerating: externalIsGenerating,
  progressMessage: externalProgressMessage,
}: GrantDocumentEditorProps) {
  const [document, setDocument] = useState<GrantDocument>(initialDocument);
  const [previewMode, setPreviewMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [progressMessage, setProgressMessage] = useState<string | null>(externalProgressMessage || null);

  // Update document when initialDocument changes
  useEffect(() => {
    setDocument(initialDocument);
  }, [initialDocument]);

  // Update progress message when external progress message changes
  useEffect(() => {
    if (externalProgressMessage) {
      setProgressMessage(externalProgressMessage);
    } else {
      setProgressMessage(null);
    }
  }, [externalProgressMessage]);

  // Update isGenerating state when external state changes
  useEffect(() => {
    setIsGenerating(externalIsGenerating);
    if (!externalIsGenerating) {
      setProgressMessage(null); // Clear progress message when generation is complete
    }
  }, [externalIsGenerating]);

  useEffect(() => {
    if (selectedSection && document) {
      const section = document.sections.find(s => s.id === selectedSection);
      if (section) {
        const words = section.content.trim().split(/\s+/).filter(word => word.length > 0);
        setWordCount(words.length);
      }
    }
  }, [selectedSection, document]);

  const handleSectionUpdate = (sectionId: string, content: string) => {
    setDocument(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, content, last_updated: new Date().toISOString() }
          : section
      ),
      updated_at: new Date().toISOString(),
    }));
  };

  const handleAddSection = (sectionId: string) => {
    const template = GRANT_SECTIONS.find(s => s.id === sectionId);
    if (!template) return;

    const newSection: GrantSection = {
      id: crypto.randomUUID(),
      title: template.title,
      content: SECTION_TEMPLATES[sectionId as keyof typeof SECTION_TEMPLATES] || '',
      status: 'draft',
      last_updated: new Date().toISOString(),
    };

    setDocument(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
      updated_at: new Date().toISOString(),
    }));
    setSelectedSection(newSection.id);
  };

  const handleGenerateContent = async () => {
    if (!selectedSection) return;
    
    try {
      setIsGenerating(true);
      setProgressMessage('Generating content...');
      await onGenerateSection(selectedSection, customPrompt);
      setCustomPrompt(''); // Clear the custom prompt after successful generation
    } catch (error) {
      console.error('Error generating content:', error);
      setError('Failed to generate content');
    } finally {
      setIsGenerating(false);
      setProgressMessage(null); // Clear the progress message
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setProgressMessage('Saving document...');
      await onSave({
        ...document,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving document:', error);
      setError('Failed to save document');
    } finally {
      setIsSaving(false);
      setProgressMessage(null); // Clear the progress message
    }
  };

  const handleDeleteSection = (sectionId: string) => {
    setDocument(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId),
      updated_at: new Date().toISOString(),
    }));
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
  };

  const handleFormatText = (format: 'bold' | 'italic' | 'list' | 'numbered') => {
    if (!selectedSection || !selectedText) return;

    const section = document.sections.find(s => s.id === selectedSection);
    if (!section) return;

    let newContent = section.content;
    const startIndex = section.content.indexOf(selectedText);
    const endIndex = startIndex + selectedText.length;

    switch (format) {
      case 'bold':
        newContent = section.content.slice(0, startIndex) + `**${selectedText}**` + section.content.slice(endIndex);
        break;
      case 'italic':
        newContent = section.content.slice(0, startIndex) + `*${selectedText}*` + section.content.slice(endIndex);
        break;
      case 'list':
        newContent = section.content.slice(0, startIndex) + `- ${selectedText}` + section.content.slice(endIndex);
        break;
      case 'numbered':
        newContent = section.content.slice(0, startIndex) + `1. ${selectedText}` + section.content.slice(endIndex);
        break;
    }

    handleSectionUpdate(selectedSection, newContent);
  };

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50">
      <div className="absolute inset-4 mx-auto max-w-7xl bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <DocumentTextIcon className="h-8 w-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Grant Proposal</h2>
              {isSaving ? (
                <p className="text-sm text-yellow-500">Saving...</p>
              ) : (
                <p className="text-sm text-gray-500">Last saved: {new Date(document.updated_at).toLocaleString()}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <DocumentCheckIcon className="h-5 w-5 mr-2" />
                  Save
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center p-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {progressMessage && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
            <div className="flex">
              {isGenerating ? (
                <ArrowPathIcon className="h-5 w-5 text-blue-400 mr-3 animate-spin" />
              ) : (
                <CheckCircleIcon className="h-5 w-5 text-blue-400 mr-3" />
              )}
              <p className="text-sm text-blue-700">{progressMessage}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className={`w-80 border-r border-gray-200 ${showSidebar ? '' : 'hidden'}`}>
            <div className="p-4 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">Sections</h3>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1 text-gray-400 hover:text-gray-500"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Grant Status */}
              <div className="mb-6">
                <label htmlFor="success_status" className="block text-sm font-medium text-gray-700 mb-2">
                  Grant Status
                </label>
                <div className="relative">
                  <select
                    id="success_status"
                    value={document.success_status || ''}
                    onChange={(e) => setDocument(prev => ({
                      ...prev,
                      success_status: e.target.value as 'successful' | 'unsuccessful' | null
                    }))}
                    className={`block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md appearance-none ${
                      document.success_status === 'successful' ? 'bg-green-50 border-green-300' :
                      document.success_status === 'unsuccessful' ? 'bg-red-50 border-red-300' :
                      'bg-yellow-50 border-yellow-300'
                    }`}
                  >
                    <option value="">Pending Review</option>
                    <option value="successful">Successful</option>
                    <option value="unsuccessful">Unsuccessful</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  {document.success_status === 'successful' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Funding Approved
                    </span>
                  ) : document.success_status === 'unsuccessful' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Funding Denied
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Awaiting Decision
                    </span>
                  )}
                </div>
              </div>

              {/* Existing Sections */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Existing Sections</h4>
                <div className="space-y-1">
                  {document.sections.map((section) => {
                    const sectionTemplate = GRANT_SECTIONS.find(s => s.id === section.id);
                    const displayTitle = sectionTemplate?.title || section.title;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setSelectedSection(section.id)}
                        className={`w-full text-left px-4 py-2.5 text-sm rounded-md transition-colors duration-150 flex items-center justify-between ${
                          selectedSection === section.id
                            ? 'bg-purple-50 text-purple-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {getSectionStatusIcon(section.status)}
                          <span>{displayTitle}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {section.content.trim().split(/\s+/).filter(word => word.length > 0).length} words
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available Sections */}
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Add New Section</h4>
                <div className="space-y-1">
                  {Object.keys(SECTION_TEMPLATES).map((sectionId: string) => (
                    <button
                      key={sectionId}
                      onClick={() => handleAddSection(sectionId)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-150"
                    >
                      <div className="font-medium">
                        {sectionId.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {GRANT_SECTIONS.find(s => s.id === sectionId)?.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Editor/Preview */}
            <div className="flex-1 overflow-hidden bg-gray-50">
              {selectedSection ? (
                <div className="h-full flex flex-col">
                  {previewMode ? (
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="prose max-w-none bg-white p-8 rounded-lg shadow-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {document.sections.find(s => s.id === selectedSection)?.content || ''}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 p-6">
                        <div className="h-full bg-white rounded-lg shadow-sm flex flex-col">
                          {/* Toolbar */}
                          <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() => handleFormatText('bold')}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                                title="Bold"
                              >
                                <BoldIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleFormatText('italic')}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                                title="Italic"
                              >
                                <ItalicIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleFormatText('list')}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                                title="Bullet List"
                              >
                                <ListBulletIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleFormatText('numbered')}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                                title="Numbered List"
                              >
                                <QueueListIcon className="h-5 w-5" />
                              </button>
                              <div className="h-6 w-px bg-gray-300 mx-2"></div>
                              <div className="text-sm text-gray-500">
                                {wordCount} words
                              </div>
                              <div className="text-sm text-gray-500">
                                Last updated: {new Date(document.sections.find(s => s.id === selectedSection)?.last_updated || '').toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Editor */}
                          <div className="flex-1 p-4">
                            <textarea
                              value={document.sections.find(s => s.id === selectedSection)?.content || ''}
                              onChange={(e) => handleSectionUpdate(selectedSection, e.target.value)}
                              className="w-full h-full p-4 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 resize-none font-mono text-sm"
                              placeholder="Start writing..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-6 py-4 bg-white border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <input
                          type="text"
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="Enter custom prompt for AI generation..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleGenerateContent()}
                          disabled={isGenerating}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGenerating ? (
                            <>
                              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="h-5 w-5 mr-2" />
                              Generate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteSection(selectedSection)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          <TrashIcon className="h-5 w-5 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <DocumentTextIcon className="h-12 w-12 mb-4" />
                  <p className="text-lg font-medium">Select a section to start editing</p>
                  <p className="text-sm mt-2">Or add a new section from the sidebar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 