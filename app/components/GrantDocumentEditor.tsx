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
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GrantSection, GrantDocument, AIResponse } from '@/lib/grantWriterService';
import { Project } from '@/lib/types';
import { grantWriterService } from '@/lib/grantWriterService';

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

  if (!isOpen || !document) return null;

  const handleSectionSelect = (sectionId: string) => {
    setSelectedSection(sectionId);
  };

  const handleContentChange = (sectionId: string, content: string) => {
    if (!document) return;

    setDocument({
      ...document,
      sections: document.sections.map(section =>
        section.id === sectionId
          ? { ...section, content, status: 'draft' }
          : section
      ),
    });
  };

  const handleGenerateSection = async (sectionId: string, customPromptText?: string) => {
    if (!project) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      let response: AIResponse;
      if (customPromptText) {
        response = await grantWriterService.generateCustomSection(customPromptText);
      } else {
        await onGenerateSection(sectionId);
        return;
      }

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate content');
      }

      // Update the section content
      const updatedSections = document.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            content: response.content,
            status: 'generated' as const,
            lastUpdated: new Date().toISOString(),
          };
        }
        return section;
      });

      setDocument(prev => ({
        ...prev,
        sections: updatedSections,
      }));

      // Remove automatic save
      setCustomPrompt('');
    } catch (error) {
      console.error('Error generating section:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!document) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await onSave(document);
      // Update the local document state to match the saved state
      setDocument(prev => ({
        ...prev,
        status: 'in_progress',
        updatedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error saving document:', error);
      setError(error instanceof Error ? error.message : 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormatText = (format: string) => {
    if (!selectedSection || !document) return;

    const section = document.sections.find(s => s.id === selectedSection);
    if (!section) return;

    const textarea = window.document.querySelector('#content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = section.content.substring(start, end);
    let newText = section.content;

    switch (format) {
      case 'bold':
        newText = section.content.substring(0, start) + `**${selectedText}**` + section.content.substring(end);
        break;
      case 'italic':
        newText = section.content.substring(0, start) + `*${selectedText}*` + section.content.substring(end);
        break;
      case 'bullet':
        newText = section.content.substring(0, start) + `\n- ${selectedText}` + section.content.substring(end);
        break;
      case 'numbered-list':
        newText = section.content.substring(0, start) + `\n1. ${selectedText}` + section.content.substring(end);
        break;
      case 'quote':
        newText = section.content.substring(0, start) + `\n> ${selectedText}` + section.content.substring(end);
        break;
      case 'code':
        newText = section.content.substring(0, start) + `\`${selectedText}\`` + section.content.substring(end);
        break;
    }

    handleContentChange(selectedSection, newText);
  };

  const handleTextareaSelect = () => {
    const textarea = window.document.querySelector('#content') as HTMLTextAreaElement;
    if (!textarea) return;
    const section = document.sections.find(s => s.id === selectedSection);
    if (!section) return;
    setSelectedText(section.content.substring(textarea.selectionStart, textarea.selectionEnd));
  };

  const getSectionStatusIcon = (status: string) => {
    switch (status) {
      case 'generated':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'draft':
        return <PencilIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const currentSectionIndex = document.sections.findIndex(s => s.id === selectedSection);
  const canGoBack = currentSectionIndex > 0;
  const canGoForward = currentSectionIndex < document.sections.length - 1;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Grant Proposal Editor
            </h3>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Toggle Sidebar</span>
              {showSidebar ? (
                <ChevronLeftIcon className="h-6 w-6" />
              ) : (
                <ChevronRightIcon className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          {showSidebar && (
            <div className="w-64 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
              <div className="space-y-6">
                {/* Document Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Document Info</h4>
                  <div className="space-y-2">
                    <div className="text-sm flex items-center justify-between">
                      <span className="text-gray-500">Words:</span>
                      <span className="font-medium">{wordCount}</span>
                    </div>
                    <div className="text-sm flex items-center justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`font-medium ${
                        document.status === 'draft' ? 'text-yellow-500' :
                        document.status === 'in_progress' ? 'text-blue-500' :
                        'text-green-500'
                      }`}>
                        {document.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sections */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Sections</h4>
                  <div className="space-y-1">
                    {document.sections.map(section => (
                      <button
                        key={section.id}
                        onClick={() => handleSectionSelect(section.id)}
                        className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 ${
                          selectedSection === section.id
                            ? 'bg-purple-50 text-purple-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className="truncate">{section.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Section Navigation */}
            {selectedSection && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => canGoBack && handleSectionSelect(document.sections[currentSectionIndex - 1].id)}
                    disabled={!canGoBack}
                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {document.sections.find(s => s.id === selectedSection)?.title}
                  </h2>
                  <button
                    onClick={() => canGoForward && handleSectionSelect(document.sections[currentSectionIndex + 1].id)}
                    disabled={!canGoForward}
                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    {previewMode ? 'Edit' : 'Preview'}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircleIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Editor/Preview Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedSection ? (
                previewMode ? (
                  <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {document.sections.find(s => s.id === selectedSection)?.content || ''}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    {/* Toolbar */}
                    <div className="border-b border-gray-200 p-2 mb-4">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleFormatText('bold')}
                          className="p-2 rounded hover:bg-gray-100"
                          title="Bold"
                        >
                          <BoldIcon className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleFormatText('italic')}
                          className="p-2 rounded hover:bg-gray-100"
                          title="Italic"
                        >
                          <ItalicIcon className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleFormatText('bullet')}
                          className="p-2 rounded hover:bg-gray-100"
                          title="Bullet List"
                        >
                          <ListBulletIcon className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleFormatText('numbered-list')}
                          className="p-2 hover:bg-gray-100 rounded"
                          title="Numbered List"
                        >
                          <QueueListIcon className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleFormatText('quote')}
                          className="p-2 hover:bg-gray-100 rounded"
                          title="Quote"
                        >
                          <ChatBubbleLeftIcon className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleFormatText('code')}
                          className="p-2 rounded hover:bg-gray-100"
                          title="Code"
                        >
                          <CodeBracketIcon className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Content Editor */}
                    <textarea
                      id="content"
                      value={document.sections.find(s => s.id === selectedSection)?.content || ''}
                      onChange={(e) => {
                        const updatedSections = document.sections.map(section => {
                          if (section.id === selectedSection) {
                            return {
                              ...section,
                              content: e.target.value,
                              status: 'draft' as const,
                              lastUpdated: new Date().toISOString(),
                            };
                          }
                          return section;
                        });
                        setDocument(prev => ({
                          ...prev,
                          sections: updatedSections,
                        }));
                      }}
                      onSelect={handleTextareaSelect}
                      className="flex-1 w-full resize-none border-0 focus:ring-0 p-0"
                      placeholder="Start writing your content..."
                    />
                  </div>
                )
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Select a section to begin editing
                </div>
              )}
            </div>

            {/* Bottom Bar with Prompt Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Enter a custom prompt for this section..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <DocumentCheckIcon className="h-4 w-4 mr-1.5" />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => selectedSection && handleGenerateSection(selectedSection, customPrompt)}
                    disabled={!selectedSection || isGenerating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-1.5" />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 