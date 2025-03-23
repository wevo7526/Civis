import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FundraisingStrategy } from './types';

const supabase = createClientComponentClient();

export const fundraisingService = {
  async createStrategy(strategy: Omit<FundraisingStrategy, 'id' | 'created_at' | 'updated_at' | 'user_id'>) {
    try {
      const { data, error } = await supabase
        .from('fundraising_strategies')
        .insert([strategy])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating fundraising strategy:', error);
      throw error;
    }
  },

  async getStrategies() {
    try {
      const { data, error } = await supabase
        .from('fundraising_strategies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching fundraising strategies:', error);
      throw error;
    }
  },

  async getStrategy(id: string) {
    try {
      const { data, error } = await supabase
        .from('fundraising_strategies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching fundraising strategy:', error);
      throw error;
    }
  },

  async updateStrategy(id: string, updates: Partial<FundraisingStrategy>) {
    try {
      const { data, error } = await supabase
        .from('fundraising_strategies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating fundraising strategy:', error);
      throw error;
    }
  },

  async deleteStrategy(id: string) {
    try {
      const { error } = await supabase
        .from('fundraising_strategies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting fundraising strategy:', error);
      throw error;
    }
  },

  async updateProgress(id: string, progress: number) {
    try {
      const { data, error } = await supabase
        .from('fundraising_strategies')
        .update({ 
          progress,
          status: progress >= 100 ? 'completed' : 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating strategy progress:', error);
      throw error;
    }
  },

  async generateInsights(id: string) {
    try {
      const strategy = await this.getStrategy(id);
      if (!strategy) throw new Error('Strategy not found');

      const response = await fetch('/api/ai/generate-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ strategy }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const { insights, recommendations } = await response.json();

      // Update the strategy with new insights
      return await this.updateStrategy(id, {
        insights,
        recommendations,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }
}; 