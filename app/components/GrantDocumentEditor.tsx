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
import { Project } from '@/lib/types';
import { grantWriterService, AIResponse } from '@/app/lib/grantWriterService';
import dynamic from 'next/dynamic';

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface GrantSectionTemplate {
  id: string;
  title: string;
  description: string;
  required: boolean;
}

type SectionTemplateKey = 
  | 'executive_summary'
  | 'organization_background'
  | 'project_overview'
  | 'problem_statement'
  | 'target_population'
  | 'methodology'
  | 'timeline'
  | 'budget'
  | 'evaluation'
  | 'sustainability'
  | 'partnerships'
  | 'capacity';

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
  onSave: (document: GrantDocument) => void;
  onGenerateSection: (sectionId: string, customPrompt?: string) => Promise<void>;
  isGenerating?: boolean;
  progressMessage?: string | null;
}

const SECTION_TEMPLATES: Record<SectionTemplateKey, string> = {
  executive_summary: `## Executive Summary\n\n[Your project summary here]\n\n### Key Points\n- Project Overview\n- Mission Alignment\n- Expected Impact\n- Funding Request\n- Timeline`,
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
  isGenerating: externalIsGenerating = false,
  progressMessage: externalProgressMessage = null,
}: GrantDocumentEditorProps) {
  const [document, setDocument] = useState<GrantDocument>(initialDocument);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(externalIsGenerating);
  const [progressMessage, setProgressMessage] = useState(externalProgressMessage || '');
  const [wordCount, setWordCount] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedText, setSelectedText] = useState('');

  // Update document when initialDocument changes
  useEffect(() => {
    setDocument(initialDocument);
  }, [initialDocument]);

  // Update isGenerating when externalIsGenerating changes
  useEffect(() => {
    setIsGenerating(externalIsGenerating);
  }, [externalIsGenerating]);

  // Update progressMessage when externalProgressMessage changes
  useEffect(() => {
    setProgressMessage(externalProgressMessage || '');
  }, [externalProgressMessage]);

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
          ? { ...section, content: content || '', last_updated: new Date().toISOString() }
          : section
      ),
      updated_at: new Date().toISOString(),
    }));
  };

  const handleSectionTitleUpdate = (sectionId: string, newTitle: string) => {
    setDocument(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? { ...section, title: newTitle, last_updated: new Date().toISOString() }
          : section
      ),
      updated_at: new Date().toISOString(),
    }));
  };

  const handleSectionContentUpdate = (sectionId: string, newContent: string) => {
    setDocument(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? { ...section, content: newContent, last_updated: new Date().toISOString() }
          : section
      ),
      updated_at: new Date().toISOString(),
    }));
  };

  const handleAddSection = (sectionId: SectionTemplateKey) => {
    const template = GRANT_SECTIONS.find(s => s.id === sectionId);
    if (!template) return;

    const newSection: GrantSection = {
      id: crypto.randomUUID(),
      title: template.title,
      content: SECTION_TEMPLATES[sectionId] || '',
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
      setProgressMessage('');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveMessage('Saving document...');
      
      // Ensure all required fields are present
      const documentToSave = {
        ...document,
        title: document.title || 'Untitled Grant Document',
        status: document.status || 'draft',
        created_at: document.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sections: document.sections.map(section => ({
          ...section,
          last_updated: section.last_updated || new Date().toISOString()
        }))
      };

      console.log('Saving document:', documentToSave);
      await onSave(documentToSave);
      
      // Update local state with the saved document
      setDocument(documentToSave);
      setSaveMessage('Document saved successfully!');
    } catch (error) {
      console.error('Error saving document:', error);
      setSaveMessage(error instanceof Error ? error.message : 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    // Create a formatted document with all sections
    const formattedContent = document.sections
      .map(section => `# ${section.title}\n\n${section.content}`)
      .join('\n\n---\n\n');

    // Create a blob and download
    const blob = new Blob([formattedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title || 'grant-proposal'}.md`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

    handleSectionContentUpdate(selectedSection, newContent);
  };

  const renderPreview = () => {
    if (!previewMode) return null;

    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose max-w-none bg-white p-8 rounded-lg shadow-sm">
          {document.sections.map((section, index) => (
            <div key={section.id} className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{section.title || 'Untitled Section'}</h2>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {section.content || ''}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleEditorChange = (value: string | null) => {
    if (!selectedSection) return;
    handleSectionContentUpdate(selectedSection, value || '');
  };

  const handleTitleChange = (value: string | null) => {
    if (!selectedSection) return;
    handleSectionTitleUpdate(selectedSection, value || '');
  };

  const handleStatusChange = (newStatus: 'draft' | 'submitted' | 'approved' | 'rejected') => {
    setDocument(prev => ({
      ...prev,
      status: newStatus
    }));
  };

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Grant Proposal Editor</h2>
            {saveMessage && (
              <span className={`text-sm ${saveMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                {saveMessage}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Export
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md flex items-center"
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
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

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
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-gray-500">
                            {section.content.trim().split(/\s+/).filter(word => word.length > 0).length} words
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSection(section.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                            title="Delete section"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
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
                      onClick={() => handleAddSection(sectionId as SectionTemplateKey)}
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
          <div className="flex-1 overflow-hidden bg-gray-50">
            {previewMode ? (
              renderPreview()
            ) : (
              <div className="h-full flex flex-col">
                {selectedSection ? (
                  <>
                    <div className="p-4 border-b">
                      <input
                        type="text"
                        value={document.sections.find(s => s.id === selectedSection)?.title || ''}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className="w-full text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0"
                        placeholder="Section Title"
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="h-full">
                        <textarea
                          value={document.sections.find(s => s.id === selectedSection)?.content || ''}
                          onChange={(e) => handleEditorChange(e.target.value)}
                          className="w-full h-full p-4 resize-none border-none focus:outline-none focus:ring-0"
                          placeholder="Start writing your section..."
                        />
                      </div>
                    </div>
                    {/* AI Prompt Bar */}
                    <div className="p-4 border-t bg-white">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="Enter custom prompt for AI generation..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
                        />
                        <button
                          onClick={handleGenerateContent}
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
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <DocumentTextIcon className="h-12 w-12 mb-4" />
                    <p className="text-lg font-medium">Select a section to start editing</p>
                    <p className="text-sm mt-2">Or add a new section from the sidebar</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 