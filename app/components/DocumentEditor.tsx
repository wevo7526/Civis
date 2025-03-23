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
  const [saveError, setSaveError] = useState<string | null>(null);

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
      setSaveError(null);
      
      // Validate inputs
      if (!title.trim()) {
        throw new Error('Title is required');
      }
      
      if (!content.trim()) {
        throw new Error('Content is required');
      }

      // Call the onSave prop with the current title and content
      await onSave(title.trim(), content.trim());
      
      // If save is successful, close the editor
      onClose();
    } catch (error) {
      console.error('Error saving document:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save document');
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
    <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-purple-50 rounded-xl">
              <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {externalIsEditing ? 'Edit' : 'Create'} {getDocumentTypeTitle()}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Project: {projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 rounded-xl p-2 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Editor Sidebar */}
          <div className="w-72 border-r border-gray-100 bg-gray-50/50 p-6 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Templates</h3>
                <div className="space-y-2">
                  {TEMPLATES[type].map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        activeTemplate === template.id
                          ? 'bg-purple-100 text-purple-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Editor Main Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-100 bg-white">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50/50"
                placeholder="Document Title"
              />
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Formatting Toolbar */}
              <div className="px-8 py-3 border-b border-gray-100 bg-white">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 bg-gray-50/50 rounded-lg p-1">
                    <button
                      onClick={() => handleFormatText('bold')}
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-white rounded-md transition-all duration-200"
                      title="Bold"
                    >
                      <BoldIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleFormatText('italic')}
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-white rounded-md transition-all duration-200"
                      title="Italic"
                    >
                      <ItalicIcon className="h-4 w-4" />
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <button
                      onClick={() => handleFormatText('bullet')}
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-white rounded-md transition-all duration-200"
                      title="Bullet List"
                    >
                      <ListBulletIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleFormatText('number')}
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-white rounded-md transition-all duration-200"
                      title="Numbered List"
                    >
                      <QueueListIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-1 bg-gray-50/50 rounded-lg p-1">
                    <button
                      onClick={() => handleFormatText('quote')}
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-white rounded-md transition-all duration-200"
                      title="Quote"
                    >
                      <ChatBubbleLeftIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleFormatText('code')}
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-white rounded-md transition-all duration-200"
                      title="Code Block"
                    >
                      <CodeBracketIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                {previewMode ? (
                  <div className="h-full overflow-y-auto p-8 prose prose-purple max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onSelect={handleTextareaSelect}
                    className="w-full h-full p-8 font-mono text-sm focus:outline-none resize-none bg-gray-50/50"
                    placeholder="Start writing your content here..."
                  />
                )}
              </div>
              
              {/* AI Generation Bar */}
              <div className="border-t border-gray-100 bg-white p-4">
                <div className="max-w-3xl mx-auto">
                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Ask AI to help with your content..."
                      className="w-full pl-5 pr-32 py-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-gray-50/50"
                      rows={1}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className={`inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white ${
                          isGenerating || !prompt.trim()
                            ? 'bg-purple-400 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-sm hover:shadow-md`}
                      >
                        {isGenerating ? (
                          <>
                            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
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
                  {progressMessage && (
                    <div className="mt-3 flex items-center text-sm text-purple-600">
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      {progressMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 bg-white">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="inline-flex items-center px-4 py-2.5 border border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit Mode' : 'Preview Mode'}
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 border border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <DocumentCheckIcon className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
          {saveError && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center">
              <XMarkIcon className="h-4 w-4 mr-2" />
              {saveError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 