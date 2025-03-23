'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  PaperClipIcon, 
  ArrowUpTrayIcon, 
  PlusIcon, 
  CheckCircleIcon, 
  ArrowPathIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import mammoth from 'mammoth';

interface Document {
  id: string;
  title: string;
  content: string;
  type: string;
}

interface AnalysisResult {
  keyFindings: {
    category: string;
    findings: string[];
  }[];
  insights: {
    category: string;
    insights: string[];
  }[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    rationale: string;
  }[];
  relevantDocuments: {
    title: string;
    content: string;
    similarity: number;
  }[];
}

interface AnalysisProgress {
  stage: string;
  progress: number;
  details: string;
}

interface FollowUpQuestion {
  question: string;
  answer: string;
  timestamp: string;
}

export default function DocumentAnalysis() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>({
    stage: '',
    progress: 0,
    details: ''
  });
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setAnalysisProgress({
      stage: 'Processing document',
      progress: 0,
      details: 'Extracting content from file...'
    });

    try {
      let content = '';
      const fileType = file.type || file.name.split('.').pop()?.toLowerCase();

      setAnalysisProgress({
        stage: 'Processing document',
        progress: 0.3,
        details: 'Reading file content...'
      });

      if (fileType === 'docx' || file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else {
        content = await file.text();
      }

      setAnalysisProgress({
        stage: 'Processing document',
        progress: 0.6,
        details: 'Cleaning up content...'
      });

      content = content
        .replace(/\u0000/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      setAnalysisProgress({
        stage: 'Processing document',
        progress: 1,
        details: 'Document processed successfully'
      });

      const document = {
        id: crypto.randomUUID(),
        title: file.name,
        content,
        type: fileType || 'txt',
      };

      setDocuments([document]);
      setError(null);
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Failed to process file. Please try again.');
    } finally {
      setIsLoading(false);
      setAnalysisProgress({
        stage: '',
        progress: 0,
        details: ''
      });
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || documents.length === 0) return;

    setIsLoading(true);
    setError(null);
    setAnalysisProgress({
      stage: 'Initializing analysis',
      progress: 0,
      details: 'Preparing documents for analysis...'
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to use the analysis feature');
      }

      setAnalysisProgress({
        stage: 'Analyzing documents',
        progress: 0.2,
        details: 'Processing document content...'
      });

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query,
          documents: documents.map(doc => ({
            id: doc.id,
            content: doc.content,
            title: doc.title,
            type: doc.type,
          })),
        }),
      });

      setAnalysisProgress({
        stage: 'Analyzing documents',
        progress: 0.5,
        details: 'Generating insights...'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze documents');
      }

      setAnalysisProgress({
        stage: 'Analyzing documents',
        progress: 0.8,
        details: 'Finalizing results...'
      });

      setAnalysis(data);
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze documents');
    } finally {
      setIsLoading(false);
      setAnalysisProgress({
        stage: '',
        progress: 0,
        details: ''
      });
    }
  };

  const handleFollowUpQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpQuery.trim() || !analysis) return;

    setIsAskingFollowUp(true);
    try {
      const response = await fetch('/api/ai/follow-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: followUpQuery,
          context: analysis,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setFollowUpQuestions(prev => [...prev, {
        question: followUpQuery,
        answer: data.answer,
        timestamp: new Date().toISOString()
      }]);
      setFollowUpQuery('');
    } catch (error) {
      console.error('Follow-up error:', error);
      setError('Failed to process follow-up question');
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  const openModal = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Query Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleAnalyze} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your analysis query..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading || documents.length === 0}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim() || documents.length === 0}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200" />
                <span className="text-sm">{analysisProgress.stage}</span>
              </div>
            ) : (
              <>
                <ArrowUpTrayIcon className="w-5 h-5" />
                Analyze
              </>
            )}
          </button>
        </form>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Documents</h3>
          <label className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg cursor-pointer hover:bg-purple-100">
            <PlusIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Add Document</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept=".txt,.pdf,.doc,.docx"
            />
          </label>
        </div>
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <PaperClipIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{doc.title}</span>
              </div>
              <button
                onClick={() => setDocuments(prev => prev.filter(d => d.id !== doc.id))}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
          {documents.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No documents uploaded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600">{analysisProgress.stage}</p>
          <p className="text-sm text-gray-500 mt-2">{analysisProgress.details}</p>
          <div className="w-full max-w-xs mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress.progress * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              {Math.round(analysisProgress.progress * 100)}% complete
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Key Findings Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Key Findings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Findings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysis.keyFindings.map((category, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category.category}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {category.findings.join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => openModal(category)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recommendations</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommendation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysis.recommendations.map((rec, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{rec.recommendation}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{rec.rationale}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => openModal(rec)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Follow-up Questions Section */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Follow-up Questions</h3>
            <form onSubmit={handleFollowUpQuestion} className="flex gap-4 mb-4">
              <input
                type="text"
                value={followUpQuery}
                onChange={(e) => setFollowUpQuery(e.target.value)}
                placeholder="Ask a follow-up question..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isAskingFollowUp}
              />
              <button
                type="submit"
                disabled={isAskingFollowUp || !followUpQuery.trim()}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAskingFollowUp ? 'Asking...' : 'Ask'}
              </button>
            </form>

            <div className="space-y-4">
              {followUpQuestions.map((qa, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{qa.question}</p>
                      <p className="text-sm text-gray-500 mt-1">{qa.answer}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(qa.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedItem.category || 'Details'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {selectedItem.findings ? (
                  // Key Findings Modal Content
                  <div className="space-y-2">
                    {selectedItem.findings.map((finding: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
                        <p className="text-gray-600">{finding}</p>
                      </div>
                    ))}
                  </div>
                ) : selectedItem.recommendation ? (
                  // Recommendation Modal Content
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        selectedItem.priority === 'high' ? 'bg-red-100 text-red-800' :
                        selectedItem.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedItem.priority.charAt(0).toUpperCase() + selectedItem.priority.slice(1)} Priority
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendation</h4>
                      <p className="text-gray-600">{selectedItem.recommendation}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Rationale</h4>
                      <p className="text-gray-600">{selectedItem.rationale}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 