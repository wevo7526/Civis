import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface Donor {
  id: string;
  name: string;
  email: string;
  last_donation: string;
  amount: number;
  engagement: 'high' | 'medium' | 'low';
  last_contact: string;
  created_at: string;
  updated_at: string;
}

export const donorService = {
  async getDonors() {
    const supabase = createClientComponentClient();
    const { data, error } = await supabase
      .from('donors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Donor[];
  },

  async addDonor(donor: Omit<Donor, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = createClientComponentClient();
    const { data, error } = await supabase
      .from('donors')
      .insert([donor])
      .select()
      .single();

    if (error) throw error;
    return data as Donor;
  },

  async updateDonor(id: string, updates: Partial<Donor>) {
    const supabase = createClientComponentClient();
    const { data, error } = await supabase
      .from('donors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Donor;
  },

  async deleteDonor(id: string) {
    const supabase = createClientComponentClient();
    const { error } = await supabase
      .from('donors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateEngagement(id: string, engagement: Donor['engagement']) {
    return this.updateDonor(id, { engagement });
  },

  async updateLastContact(id: string) {
    return this.updateDonor(id, { last_contact: new Date().toISOString() });
  }
}; 