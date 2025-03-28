import { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

type DocumentType = 'grant' | 'insights' | 'fundraising';

interface DocumentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string) => void;
  initialData?: {
    id: string;
    title: string;
    content: string;
    type: DocumentType;
  };
  type: DocumentType;
  projectName: string;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  progressMessage: string | null | undefined;
  isEditing: boolean;
}

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
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setIsEditing(true);
    }
  }, [initialData]);

  const getDocumentTypeTitle = () => {
    switch (type) {
      case 'grant':
        return 'Grant Proposal';
      case 'insights':
        return 'Project Insights';
      case 'fundraising':
        return 'Fundraising Proposal';
      default:
        return 'Document';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      // Add context based on document type
      const enhancedPrompt = type === 'grant' 
        ? `Generate a comprehensive grant proposal with the following requirements:\n${prompt}`
        : `Generate project insights based on the following requirements:\n${prompt}`;
        
      await onGenerate(enhancedPrompt);
    } catch (err) {
      console.error('Error generating content:', err);
      setError('Failed to generate content');
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await onSave(title, content);
      onClose();
    } catch (err) {
      console.error('Error saving document:', err);
      setError('Failed to save document');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit' : 'Create'} {getDocumentTypeTitle()}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                placeholder="Enter a title"
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                placeholder="Enter content"
              />
            </div>
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                Generation Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                placeholder="Enter a prompt to generate content"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 border-t">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {isGenerating ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </button>
            {progressMessage && (
              <p className="text-sm text-gray-500">{progressMessage}</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Save
            </button>
          </div>
        </div>
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 