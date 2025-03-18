'use client';

import { useState, useRef, useEffect } from 'react';
import { PaperClipIcon, ArrowUpTrayIcon, PlusIcon } from '@heroicons/react/24/outline';
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

export default function DocumentAnalysis() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    try {
      let content = '';
      const fileType = file.type || file.name.split('.').pop()?.toLowerCase();

      if (fileType === 'docx' || file.name.endsWith('.docx')) {
        // Use mammoth to extract text from .docx files
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else {
        // Handle other file types as before
        content = await file.text();
      }

      // Clean up the content
      content = content
        .replace(/\u0000/g, '') // Remove null characters
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
        .trim();

      console.log('Extracted content:', content.substring(0, 200) + '...'); // Log first 200 chars

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
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || documents.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to use the analysis feature');
      }

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze documents');
      }

      setAnalysis(data);
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze documents');
    } finally {
      setIsLoading(false);
    }
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
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200" />
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
          <p className="text-gray-600">Analyzing documents...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
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
          {/* Matrix of Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Findings Matrix */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Key Findings</h3>
              <div className="space-y-3">
                {analysis.keyFindings.map((category, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">{category.category}</h4>
                    <div className="space-y-2">
                      {category.findings.map((finding, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2" />
                          <p className="text-sm text-gray-600">{finding}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Insights Matrix */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Strategic Insights</h3>
              <div className="space-y-3">
                {analysis.insights.map((category, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">{category.category}</h4>
                    <div className="space-y-2">
                      {category.insights.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                          <p className="text-sm text-gray-600">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations Matrix */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.recommendations.map((rec, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)} Priority
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 text-sm">{rec.recommendation}</p>
                  <p className="text-xs text-gray-600 mt-1">{rec.rationale}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Relevant Documents Matrix */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Relevant Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.relevantDocuments.map((doc, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-700 text-sm">{doc.title}</h4>
                    <span className="text-xs text-purple-600">
                      {(doc.similarity * 100).toFixed(1)}% relevant
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{doc.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 