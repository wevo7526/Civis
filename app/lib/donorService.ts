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
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        return false;
      }
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      console.log('Attempting to delete donor:', {
        donorId: id,
        userId: user.id
      });

      // First check if the donor exists and belongs to the user
      const { data: donor, error: fetchError } = await supabase
        .from('donors')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching donor:', {
          error: fetchError,
          details: fetchError.details,
          hint: fetchError.hint,
          message: fetchError.message,
          code: fetchError.code,
          donorId: id,
          userId: user.id
        });
        return false;
      }

      if (!donor) {
        console.error('Donor not found or does not belong to user:', {
          donorId: id,
          userId: user.id
        });
        return false;
      }

      console.log('Found donor to delete:', donor);

      // Store donor info for activity record
      const donorInfo = {
        name: donor.name,
        email: donor.email
      };

      // Create activity record BEFORE deletion
      const activityData = {
        user_id: user.id,
        type: 'donor_deleted',
        title: 'Donor deleted',
        description: `Deleted donor: ${donorInfo.name}`,
        metadata: {
          donor_id: id,
          donor_name: donorInfo.name,
          donor_email: donorInfo.email
        }
      };

      console.log('Creating activity record:', activityData);

      const { error: activityError } = await supabase
        .from('activities')
        .insert([activityData]);

      if (activityError) {
        console.error('Error creating activity:', {
          error: activityError,
          details: activityError.details,
          hint: activityError.hint,
          message: activityError.message,
          code: activityError.code,
          activityData
        });
        return false; // Don't proceed with deletion if activity creation fails
      }

      console.log('Successfully created activity record');

      // Delete the donor without any activity creation
      const { error: deleteError } = await supabase
        .from('donors')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id'); // Only select the id to avoid triggering any activity creation

      if (deleteError) {
        console.error('Error deleting donor:', {
          error: deleteError,
          details: deleteError.details,
          hint: deleteError.hint,
          message: deleteError.message,
          code: deleteError.code,
          donorId: id,
          userId: user.id
        });
        return false;
      }

      console.log('Successfully deleted donor');
      return true;
    } catch (error) {
      console.error('Unexpected error in deleteDonor:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
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