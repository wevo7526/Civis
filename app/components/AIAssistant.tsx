'use client';

import { useState, useEffect, useRef } from 'react';
import { SparklesIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { aiService } from '@/lib/aiService';
import { AIResponse } from '@/lib/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIAssistantProps {
  onGenerateResponse: (response: string) => void;
}

export default function AIAssistant({ onGenerateResponse }: AIAssistantProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m your nonprofit AI assistant. I can help you with:\n\n' +
                '• Fundraising strategies and donor relations\n' +
                '• Program development and impact assessment\n' +
                '• Volunteer management and engagement\n' +
                '• Grant writing and proposal development\n' +
                '• Event planning and community outreach\n' +
                '• Board governance and strategic planning\n\n' +
                'What would you like to discuss?',
        timestamp: new Date().toISOString(),
      }
    ]);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response: AIResponse = await aiService.chat(prompt);
      if (response.success && response.content) {
        onGenerateResponse(response.content);
      } else {
        setError(response.error || 'Failed to get response');
      }
    } catch (error) {
      setError('An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
      >
        <SparklesIcon className="h-6 w-6" />
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-2xl bg-white rounded-xl shadow-lg flex flex-col h-[80vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Nonprofit AI Assistant
              </Dialog.Title>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

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
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs mt-1 opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Ask about nonprofit management..."
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <PaperAirplaneIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
} 