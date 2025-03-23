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
import { GrantSection, GrantDocument, AIResponse } from '@/lib/grantWriterService';
import { Project } from '@/lib/types';
import { grantWriterService } from '@/lib/grantWriterService';

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
    case 'generated':
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    case 'draft':
      return <PencilIcon className="h-4 w-4 text-yellow-500" />;
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
  onGenerateSection: (sectionId: string) => Promise<void>;
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
  progressMessage,
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

  // Update document when initialDocument changes
  useEffect(() => {
    setDocument(initialDocument);
  }, [initialDocument]);

  // Update isGenerating state when external state changes
  useEffect(() => {
    setIsGenerating(externalIsGenerating);
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
    setDocument((prev: GrantDocument) => ({
      ...prev,
      sections: prev.sections.map((section: GrantSection) =>
        section.id === sectionId
          ? { ...section, content, lastUpdated: new Date().toISOString() }
          : section
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleAddSection = (sectionId: string) => {
    const newSection: GrantSection = {
      id: crypto.randomUUID(),
      title: sectionId,
      content: SECTION_TEMPLATES[sectionId as keyof typeof SECTION_TEMPLATES] || '',
      status: 'draft',
      lastUpdated: new Date().toISOString(),
    };

    setDocument((prev: GrantDocument) => ({
      ...prev,
      sections: [...prev.sections, newSection],
      updatedAt: new Date().toISOString(),
    }));
    setSelectedSection(newSection.id);
  };

  const handleGenerateContent = async () => {
    if (!selectedSection) return;

    try {
      setIsGenerating(true);
      setError(null);

      const response = await grantWriterService.generateCustomSection(customPrompt);
      if (response.success) {
        handleSectionUpdate(selectedSection, response.content);
      } else {
        throw new Error(response.error || 'Failed to generate content');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(document);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSection = (sectionId: string) => {
    setDocument((prev: GrantDocument) => ({
      ...prev,
      sections: prev.sections.filter((section: GrantSection) => section.id !== sectionId),
      updatedAt: new Date().toISOString(),
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
              <p className="text-sm text-gray-500">Last saved: {new Date(document.updatedAt).toLocaleString()}</p>
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
              <ArrowPathIcon className="h-5 w-5 text-blue-400 mr-3 animate-spin" />
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

              {/* Existing Sections */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Existing Sections</h4>
                <div className="space-y-1">
                  {document.sections.map((section) => (
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
                        <span>
                          {section.title.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {section.content.trim().split(/\s+/).filter(word => word.length > 0).length} words
                      </div>
                    </button>
                  ))}
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
                          <div className="flex items-center space-x-2 p-4 border-b border-gray-200">
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
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                          {wordCount} words
                        </div>
                        <div className="text-sm text-gray-500">
                          Last updated: {new Date(document.sections.find(s => s.id === selectedSection)?.lastUpdated || '').toLocaleString()}
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => onGenerateSection(selectedSection)}
                          disabled={isGenerating}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <SparklesIcon className="h-5 w-5 mr-2" />
                          {isGenerating ? 'Generating...' : 'Generate'}
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