'use client';

import { useState } from 'react';
import ChatInterface from '@/app/components/ChatInterface';

export default function AIChatPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b">
        <h1 className="text-2xl font-semibold text-gray-900">AI Chat Assistant</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload documents and ask questions to get AI-powered insights and analysis.
        </p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
} 