'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import ChatInterface with no SSR
const ChatInterface = dynamic(() => import('./ChatInterface'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>
  ),
});

interface AIAssistantFabProps {
  className?: string;
}

export default function AIAssistantFab({ className }: AIAssistantFabProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <>
      <Button
        onClick={() => handleOpenChange(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-purple-600 hover:bg-purple-700 text-white z-50 ${className ?? ''}`}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-7 w-7" />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <DialogHeader className="p-4 border-b bg-purple-600 text-white">
            <DialogTitle>AI Nonprofit Assistant</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(80vh-4rem)]">
            {isOpen && <ChatInterface />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 