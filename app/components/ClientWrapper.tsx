'use client';

import dynamic from 'next/dynamic';

const AIAssistant = dynamic(() => import('./AIAssistant'), {
  ssr: false,
});

export default function ClientWrapper() {
  const handleGenerateResponse = (response: string) => {
    // Handle the AI response here
    console.log('AI Response:', response);
  };

  return <AIAssistant onGenerateResponse={handleGenerateResponse} />;
} 