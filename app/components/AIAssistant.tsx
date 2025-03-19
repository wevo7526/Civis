'use client';

import { useState, useEffect, useRef } from 'react';
import { SparklesIcon, XMarkIcon, PaperClipIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { aiService } from '../../lib/aiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: Array<{
    name: string;
    type: string;
    content: string;
  }>;
}

interface Context {
  currentPage: string;
  timestamp: string;
  donorData?: any[];
  projectData?: any[];
  eventData?: any[];
}

export default function AIAssistant() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<Context>({
    currentPage: '',
    timestamp: new Date().toISOString(),
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle client-side initialization
  useEffect(() => {
    setMounted(true);
    // Add initial welcome message
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant for nonprofit management. I can help you with:\n\n' +
                '• Writing and content creation\n' +
                '• Project management and planning\n' +
                '• Donor relations and fundraising\n' +
                '• Stakeholder engagement\n' +
                '• Data analysis and insights\n\n' +
                'What would you like help with today?',
        timestamp: new Date().toISOString(),
      }
    ]);
  }, []);

  // Update context when page changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setContext(prev => ({
        ...prev,
        currentPage: window.location.pathname,
        timestamp: new Date().toISOString(),
      }));
    }
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Determine the appropriate AI service based on the context and message
      let response: string;
      
      if (userMessage.content.toLowerCase().includes('donor')) {
        const result = await aiService.analyzeDonorEngagement(context.donorData || []);
        response = result.message;
      } else if (userMessage.content.toLowerCase().includes('project')) {
        const result = await aiService.analyzeProjects(context.projectData || []);
        response = result.message;
      } else if (userMessage.content.toLowerCase().includes('event')) {
        const result = await aiService.analyzeEvents(context.eventData || []);
        response = result.message;
      } else {
        // Use the general chat assistant
        const chatResponse = await fetch('/api/ai/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            context,
          }),
        });

        if (!chatResponse.ok) {
          throw new Error('Failed to get AI response');
        }

        const data = await chatResponse.json();
        response = data.message;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
                AI Assistant
              </Dialog.Title>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
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
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, idx) => (
                          <div
                            key={idx}
                            className="text-sm flex items-center space-x-1"
                          >
                            <PaperClipIcon className="h-4 w-4" />
                            <span>{attachment.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
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