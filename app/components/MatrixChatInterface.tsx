'use client';

import { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Loader2, Send, User, Bot, Grid, MessageSquare } from 'lucide-react';
import { ChatMessage, StructuredResponse } from '@/lib/types';
import { aiService } from '@/lib/aiService';

interface MatrixCell {
  id: string;
  title: string;
  content: any;
  type: 'analysis' | 'recommendations' | 'insights' | 'metrics';
  timestamp: Date;
}

export default function MatrixChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const [matrixCells, setMatrixCells] = useState<MatrixCell[]>([]);
  const [viewMode, setViewMode] = useState<'chat' | 'matrix'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

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
  }, [messages, currentStreamingMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentStreamingMessage('');
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to use the chat feature');
      }

      const response = await aiService.streamChat(
        [...messages, userMessage],
        (chunk) => {
          setCurrentStreamingMessage(prev => prev + chunk);
        },
        (data) => {
          // Add new matrix cell for structured data
          const newCell: MatrixCell = {
            id: crypto.randomUUID(),
            title: data.title || 'New Analysis',
            content: data,
            type: data.type || 'analysis',
            timestamp: new Date(),
          };
          setMatrixCells(prev => [...prev, newCell]);
        }
      );

      if (!response.success) {
        // Handle specific error cases
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
        } else if (response.status === 504) {
          throw new Error('Request timed out. Please try again.');
        } else if (response.status === 401) {
          throw new Error('Session expired. Please sign in again.');
        } else {
          throw new Error(response.error || 'Failed to get response from AI service');
        }
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentStreamingMessage('');
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error in chat:', error);
      
      // Handle retry logic
      if (retryCount < MAX_RETRIES && 
          (error instanceof Error && 
           (error.message.includes('NetworkError') || 
            error.message.includes('timeout') ||
            error.message.includes('rate limit')))) {
        setRetryCount(prev => prev + 1);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        handleSubmit(e);
        return;
      }

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setCurrentStreamingMessage('');
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMatrixCell = (cell: MatrixCell) => {
    return (
      <div key={cell.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">{cell.title}</h3>
          <span className="text-xs text-gray-500">
            {new Date(cell.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="text-sm">
          {cell.type === 'analysis' && (
            <pre className="whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(cell.content, null, 2)}
            </pre>
          )}
          {cell.type === 'recommendations' && (
            <ul className="list-disc list-inside">
              {cell.content.recommendations?.map((rec: string, idx: number) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          )}
          {cell.type === 'insights' && (
            <div className="space-y-2">
              {cell.content.insights?.map((insight: string, idx: number) => (
                <p key={idx}>{insight}</p>
              ))}
            </div>
          )}
          {cell.type === 'metrics' && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(cell.content).map(([key, value]) => (
                <div key={key} className="text-xs">
                  <span className="font-medium">{key}:</span> {String(value)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* View Toggle */}
      <div className="flex items-center justify-end p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('chat')}
            className={`px-4 py-2 flex items-center gap-2 ${
              viewMode === 'chat'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-4 py-2 flex items-center gap-2 ${
              viewMode === 'matrix'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Grid className="w-4 h-4" />
            Matrix
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'chat' ? (
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <p>Welcome to the AI Assistant! How can I help you today?</p>
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  )}
                </div>
              ))}
              {currentStreamingMessage && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2">
                    <p className="text-sm whitespace-pre-wrap">{currentStreamingMessage}</p>
                  </div>
                </div>
              )}
              {isLoading && !currentStreamingMessage && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-full p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matrixCells.map(cell => renderMatrixCell(cell))}
              {matrixCells.length === 0 && (
                <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                  <p>No analysis results yet. Start a conversation to generate insights!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
} 