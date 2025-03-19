'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const AIAssistant = dynamic(() => import('./AIAssistant'), {
  ssr: false,
  loading: () => null,
});

export default function ClientWrapper() {
  return (
    <Suspense fallback={null}>
      <AIAssistant />
    </Suspense>
  );
} 