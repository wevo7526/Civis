import { SupabaseClient } from '@supabase/supabase-js';
import { Donor } from './types';

class DonorService {
  constructor(private supabase: SupabaseClient) {}

  async getDonors(): Promise<Donor[]> {
    const { data: { user }, error: userError } = await this.supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication error');
    }

    const { data, error } = await this.supabase
      .from('donors')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async addDonor(donor: Omit<Donor, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Donor> {
    const { data: { user }, error: userError } = await this.supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication error');
    }

    const { data, error } = await this.supabase
      .from('donors')
      .insert([{ ...donor, user_id: user.id }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('A donor with this email already exists');
      }
      throw error;
    }

    return data;
  }

  async updateDonor(id: string, donor: Partial<Donor>): Promise<Donor> {
    const { data: { user }, error: userError } = await this.supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication error');
    }

    const { data, error } = await this.supabase
      .from('donors')
      .update(donor)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDonor(id: string): Promise<void> {
    const { data: { user }, error: userError } = await this.supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication error');
    }

    const { error } = await this.supabase
      .from('donors')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  async updateEngagement(id: string, engagement: number): Promise<Donor> {
    const { data: { user }, error: userError } = await this.supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication error');
    }

    const { data, error } = await this.supabase
      .from('donors')
      .update({ engagement })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateLastContact(id: string, lastContact: string): Promise<Donor> {
    const { data: { user }, error: userError } = await this.supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication error');
    }

    const { data, error } = await this.supabase
      .from('donors')
      .update({ last_contact: lastContact })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// Create a function to get a new instance of the service
export function createDonorService(supabase: SupabaseClient) {
  return new DonorService(supabase);
} 