import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AIResponse {
  success: boolean;
  content: Array<{
    type: 'text';
    text: string;
  }>;
  data: {
    timestamp: string;
  };
}

export const globalAI = {
  async getAdvice(prompt: string, context?: Record<string, unknown>): Promise<string> {
    try {
      const response = await fetch('/api/ai/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          context,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || 'Failed to process request');
      }

      const responseData = await response.json() as AIResponse;
      return responseData.content[0].text;
    } catch (error) {
      console.error('Error getting AI advice:', error);
      throw error;
    }
  }
}; 