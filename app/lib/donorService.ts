import { SupabaseClient } from '@supabase/supabase-js';
import { Donor } from './types';

export const createDonorService = (supabase: SupabaseClient) => {
  const getDonors = async (): Promise<Donor[]> => {
    const { data, error } = await supabase
      .from('donors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const addDonor = async (donor: Omit<Donor, 'id' | 'created_at' | 'updated_at'>): Promise<Donor> => {
    const { data, error } = await supabase
      .from('donors')
      .insert([donor])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateDonor = async (id: string, donor: Partial<Donor>): Promise<Donor> => {
    const { data, error } = await supabase
      .from('donors')
      .update({ ...donor, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteDonor = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('donors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  return {
    getDonors,
    addDonor,
    updateDonor,
    deleteDonor,
  };
}; 