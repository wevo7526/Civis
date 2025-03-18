'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import DocumentAnalysis from '@/components/DocumentAnalysis';

export default function AIChatPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Document Analysis</h1>
        <p className="mt-2 text-gray-600">
          Upload your documents and get structured insights, key findings, and recommendations.
        </p>
      </div>
      <div className="bg-gray-50 rounded-lg p-6">
        <DocumentAnalysis />
      </div>
    </div>
  );
} 