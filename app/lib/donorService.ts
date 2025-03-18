import { SupabaseClient } from '@supabase/supabase-js';
import { Donor } from './types';

export const createDonorService = (supabase: SupabaseClient) => {
  const getDonors = async (): Promise<Donor[]> => {
    try {
      const { data, error } = await supabase
        .from('donors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching donors:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in getDonors:', error);
      return [];
    }
  };

  const addDonor = async (donor: Omit<Donor, 'id' | 'created_at' | 'updated_at'>): Promise<Donor | null> => {
    try {
      console.log('Raw donor data:', JSON.stringify(donor, null, 2));
      
      // Validate required fields
      if (!donor.name || !donor.email || !donor.donation_date || !donor.user_id || !donor.amount) {
        console.error('Missing required fields:', {
          name: !!donor.name,
          email: !!donor.email,
          donation_date: !!donor.donation_date,
          user_id: !!donor.user_id,
          amount: !!donor.amount
        });
        return null;
      }

      // Clean up the donor data by removing undefined values and formatting the date
      const cleanDonor = {
        name: donor.name.trim(),
        email: donor.email.trim(),
        phone: donor.phone?.trim() || null,
        donation_date: donor.donation_date,
        status: donor.status || 'active',
        notes: donor.notes?.trim() || null,
        user_id: donor.user_id,
        amount: Number(donor.amount), // Ensure amount is a number
      };

      console.log('Cleaned donor data:', JSON.stringify(cleanDonor, null, 2));

      // Check for existing donor with the same email
      const { count, error: countError } = await supabase
        .from('donors')
        .select('*', { count: 'exact', head: true })
        .eq('email', cleanDonor.email);

      if (countError) {
        console.error('Error checking existing donor:', countError);
        return null;
      }

      if (count && count > 0) {
        console.error('Donor with this email already exists');
        throw new Error('A donor with this email address already exists. Please use a different email or update the existing donor.');
      }

      // Insert the new donor
      const { data, error } = await supabase
        .from('donors')
        .insert([cleanDonor])
        .select()
        .single();

      if (error) {
        console.error('Error adding donor:', error);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        return null;
      }

      console.log('Successfully added donor:', data);
      return data;
    } catch (error) {
      console.error('Error in addDonor:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      return null;
    }
  };

  const updateDonor = async (id: string, donor: Partial<Donor>): Promise<Donor | null> => {
    try {
      // Clean up the donor data by removing undefined values and formatting the date
      const cleanDonor = {
        ...donor,
        phone: donor.phone?.trim() || null,
        notes: donor.notes?.trim() || null,
        donation_date: donor.donation_date,
        amount: donor.amount ? Number(donor.amount) : undefined, // Ensure amount is a number if present
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('donors')
        .update(cleanDonor)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating donor:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error in updateDonor:', error);
      return null;
    }
  };

  const deleteDonor = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('donors')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting donor:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error in deleteDonor:', error);
      return false;
    }
  };

  return {
    getDonors,
    addDonor,
    updateDonor,
    deleteDonor,
  };
}; 