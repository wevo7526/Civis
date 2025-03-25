'use client';

import dynamic from 'next/dynamic';

const AIAssistantFab = dynamic(() => import('./AIAssistantFab'), {
  ssr: false,
});

export default function ClientWrapper() {
  return <AIAssistantFab />;
} 