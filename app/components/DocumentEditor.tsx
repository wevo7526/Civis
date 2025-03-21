import { useState, useEffect } from 'react';
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
  DocumentDuplicateIcon,
  DocumentCheckIcon,
  SparklesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocumentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string) => Promise<void>;
  initialData?: {
    id: string;
    title: string;
    content: string;
    type: 'grant' | 'fundraising' | 'insights';
  };
  type: 'grant' | 'fundraising' | 'insights';
  projectName: string;
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  progressMessage?: string | null;
  isEditing?: boolean;
}

const TEMPLATES = {
  grant: [
    { 
      id: 1, 
      name: 'Executive Summary', 
      content: `## Executive Summary

[Your project summary here]

### Key Points
- Project Overview
- Mission Alignment
- Expected Impact
- Funding Request
- Timeline` 
    },
    { 
      id: 2, 
      name: 'Project Goals', 
      content: `## Project Goals and Objectives

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
- Metric 3: [Description]` 
    },
    { 
      id: 3, 
      name: 'Budget Breakdown', 
      content: `## Budget Breakdown

| Category | Amount | Description | Justification |
|----------|---------|-------------|---------------|
| [Category] | $[Amount] | [Description] | [Justification] |

### Budget Narrative
[Detailed explanation of budget items and their necessity]` 
    },
    { 
      id: 4, 
      name: 'Impact Statement', 
      content: `## Impact Statement

### Target Population
[Description of who will benefit]

### Expected Outcomes
1. [Outcome 1]
2. [Outcome 2]
3. [Outcome 3]

### Long-term Impact
[Description of lasting effects]` 
    },
    { 
      id: 5, 
      name: 'Timeline', 
      content: `## Project Timeline

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
  3. [Activity 3]` 
    },
  ],
  fundraising: [
    { 
      id: 1, 
      name: 'Funding Goals', 
      content: `## Funding Goals

### Target Amount
- Total Goal: $[Amount]
- Timeline: [Duration]
- Key Milestones:
  1. [Milestone 1]
  2. [Milestone 2]
  3. [Milestone 3]

### Fund Allocation
| Category | Amount | Purpose |
|----------|---------|---------|
| [Category] | $[Amount] | [Purpose] |` 
    },
    { 
      id: 2, 
      name: 'Donor Strategy', 
      content: `## Donor Strategy

### Target Donors
1. [Donor Segment 1]
   - Characteristics
   - Giving Capacity
   - Engagement Approach

2. [Donor Segment 2]
   - Characteristics
   - Giving Capacity
   - Engagement Approach

### Engagement Plan
- Outreach Methods
- Communication Schedule
- Recognition Program` 
    },
    { 
      id: 3, 
      name: 'Budget Allocation', 
      content: `## Budget Allocation

### Fundraising Costs
| Category | Amount | Purpose |
|----------|---------|---------|
| [Category] | $[Amount] | [Purpose] |

### ROI Projections
- Expected Return: $[Amount]
- Cost per Dollar Raised: $[Amount]
- Timeline to Break Even: [Duration]` 
    },
  ],
  insights: [
    { 
      id: 1, 
      name: 'Key Findings', 
      content: `## Key Findings

### Project Performance
1. [Finding 1]
2. [Finding 2]
3. [Finding 3]

### Impact Analysis
- [Impact Point 1]
- [Impact Point 2]
- [Impact Point 3]` 
    },
    { 
      id: 2, 
      name: 'Recommendations', 
      content: `## Recommendations

### Strategic Recommendations
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]

### Implementation Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]` 
    },
    { 
      id: 3, 
      name: 'Action Items', 
      content: `## Action Items

### Immediate Actions
1. [Action 1]
   - Timeline: [Duration]
   - Resources Needed: [List]
   - Success Criteria: [Description]

### Long-term Actions
1. [Action 1]
   - Timeline: [Duration]
   - Resources Needed: [List]
   - Success Criteria: [Description]` 
    },
  ],
};

export default function DocumentEditor({
  isOpen,
  onClose,
  onSave,
  initialData,
  type,
  projectName,
  onGenerate,
  isGenerating,
  progressMessage,
  isEditing: externalIsEditing,
}: DocumentEditorProps) {
  const [title, setTitle] = useState(initialData?.title || `${projectName} ${type === 'grant' ? 'Grant Proposal' : type === 'fundraising' ? 'Fundraising Strategy' : 'Project Insights'}`);
  const [content, setContent] = useState(initialData?.content || '');
  const [prompt, setPrompt] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<number | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
    } else {
      setTitle(`${projectName} ${type === 'grant' ? 'Grant Proposal' : type === 'fundraising' ? 'Fundraising Strategy' : 'Project Insights'}`);
      setContent('');
    }
  }, [initialData, projectName, type]);

  useEffect(() => {
    // Update word count
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  useEffect(() => {
    // Simulate progress during generation
    if (isGenerating) {
      const interval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 5;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setGenerationProgress(0);
    }
  }, [isGenerating]);

  // Update content when initialData changes
  useEffect(() => {
    if (initialData?.content) {
      setContent(initialData.content);
    }
  }, [initialData?.content]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerationProgress(0);
    
    // Add context based on document type
    const enhancedPrompt = type === 'grant' 
      ? `Generate a comprehensive grant proposal with the following requirements:\n${prompt}`
      : type === 'fundraising'
      ? `Generate a detailed fundraising strategy with the following requirements:\n${prompt}`
      : `Generate project insights based on the following requirements:\n${prompt}`;
      
    await onGenerate(enhancedPrompt);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(title, content);
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormatText = (format: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let newText = content;

    switch (format) {
      case 'bold':
        newText = content.substring(0, start) + `**${selectedText}**` + content.substring(end);
        break;
      case 'italic':
        newText = content.substring(0, start) + `*${selectedText}*` + content.substring(end);
        break;
      case 'bullet':
        newText = content.substring(0, start) + `\n- ${selectedText}` + content.substring(end);
        break;
      case 'numbered-list':
        newText = content.substring(0, start) + `\n1. ${selectedText}` + content.substring(end);
        break;
      case 'quote':
        newText = content.substring(0, start) + `\n> ${selectedText}` + content.substring(end);
        break;
      case 'code':
        newText = content.substring(0, start) + `\`${selectedText}\`` + content.substring(end);
        break;
    }

    setContent(newText);
  };

  const handleTextareaSelect = () => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;
    setSelectedText(content.substring(textarea.selectionStart, textarea.selectionEnd));
  };

  const handleTemplateSelect = (templateId: number) => {
    const template = TEMPLATES[type].find(t => t.id === templateId);
    if (template) {
      setContent(prev => prev + '\n\n' + template.content);
      setActiveTemplate(templateId);
    }
  };

  const getDocumentTypeTitle = () => {
    switch (type) {
      case 'grant':
        return 'Grant Proposal';
      case 'fundraising':
        return 'Fundraising Strategy';
      case 'insights':
        return 'Project Insights';
      default:
        return 'Document';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-medium text-gray-900">
              {externalIsEditing ? `Edit ${getDocumentTypeTitle()}` : `Create New ${getDocumentTypeTitle()}`}
            </h3>
          </div>
          <div className="flex items-center space-x-4">
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
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium capitalize">{type}</span>
                  </div>
                </div>
              </div>

              {/* Templates */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Templates</h4>
                <div className="space-y-2">
                  {TEMPLATES[type].map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                        activeTemplate === template.id
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Assistant */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">AI Assistant</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="w-full flex items-center px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Show AI Suggestions
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Title Input */}
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xl font-semibold border-0 focus:ring-0 p-0"
                placeholder="Enter document title..."
              />
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto">
              {!externalIsEditing && !content ? (
                <div className="h-full p-4">
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <SparklesIcon className="mx-auto h-12 w-12 text-purple-600" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">Generate with AI</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Describe what you want to generate and let AI help you create content
                      </p>
                    </div>
                    <div className="space-y-4">
                      <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={6}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        placeholder={`Describe what you want in your ${getDocumentTypeTitle().toLowerCase()}...`}
                      />
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <div className="w-full">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                              <div 
                                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${generationProgress}%` }}
                              ></div>
                            </div>
                            <div className="flex items-center justify-center">
                              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                              {progressMessage || `Generating... ${generationProgress}%`}
                            </div>
                          </div>
                        ) : (
                          <>
                            <PencilIcon className="h-5 w-5 mr-2" />
                            Generate Content
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  {/* Toolbar */}
                  <div className="border-b border-gray-200 p-2">
                    <div className="flex items-center justify-between">
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
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowTemplates(!showTemplates)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4 mr-1.5" />
                          Templates
                        </button>
                        <button
                          onClick={() => setPreviewMode(!previewMode)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <EyeIcon className="h-4 w-4 mr-1.5" />
                          {previewMode ? 'Edit' : 'Preview'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Editor/Preview Area */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    {previewMode ? (
                      <div className="prose max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                      </div>
                    ) : (
                      <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onSelect={handleTextareaSelect}
                        className="w-full h-full resize-none border-0 focus:ring-0 p-0"
                        placeholder="Start writing your content..."
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
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
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 