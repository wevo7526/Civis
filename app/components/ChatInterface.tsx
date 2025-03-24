'use client';

import { useState, useRef, useEffect } from 'react';
import { PaperClipIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { AIResponse } from '@/lib/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Document {
  id: string;
  name: string;
  content: string;
  uploadedAt: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsLoading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();
        
        const newDocument: Document = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          content: text,
          uploadedAt: new Date(),
        };

        setDocuments(prev => [...prev, newDocument]);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to use the chat feature');
      }

      console.log('Sending request to AI chat API...');
      const requestBody = {
        message: input,
        documents: documents.map(doc => ({
          id: doc.id,
          content: doc.content,
        })),
      };
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      const data = await response.json() as AIResponse;
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to use the chat feature');
        }
        if (response.status === 404) {
          throw new Error('API endpoint not found. Please check the API route configuration.');
        }
        if (response.status === 500) {
          throw new Error(`Server error: ${data.error || 'Unknown server error'}`);
        }
        throw new Error(`API error (${response.status}): ${data.error || 'Failed to get response'}`);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content || data.message || 'No response available.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Document List */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents</h3>
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">{doc.name}</span>
              <button
                onClick={() => setDocuments(prev => prev.filter(d => d.id !== doc.id))}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
          <label className="flex items-center justify-center w-full p-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <PaperClipIcon className="w-5 h-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-500">Upload Documents</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept=".txt,.pdf,.doc,.docx"
            />
          </label>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </form>
    </div>
  );
} 