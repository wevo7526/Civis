import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Donor {
  id: string;
  name: string;
  email: string;
  last_donation: string;
  amount: number;
  engagement: number;
  last_contact: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const donorService = {
  async getDonors(): Promise<Donor[]> {
    const { data, error } = await supabase
      .from('donors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addDonor(donor: Omit<Donor, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Donor> {
    const { data, error } = await supabase
      .from('donors')
      .insert([donor])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDonor(id: string, donor: Partial<Donor>): Promise<Donor> {
    const { data, error } = await supabase
      .from('donors')
      .update(donor)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDonor(id: string): Promise<void> {
    const { error } = await supabase
      .from('donors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateEngagement(id: string, engagement: number): Promise<Donor> {
    const { data, error } = await supabase
      .from('donors')
      .update({ engagement })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLastContact(id: string, lastContact: string): Promise<Donor> {
    const { data, error } = await supabase
      .from('donors')
      .update({ last_contact: lastContact })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}; 