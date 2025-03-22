import { SupabaseClient } from '@supabase/supabase-js';

export interface Activity {
  user_id: string;
  type: string;
  title: string;
  description: string;
}

export const createActivityService = (supabase: SupabaseClient) => {
  const createActivity = async (activity: Activity): Promise<Activity | null> => {
    try {
      // Ensure user_id is present
      if (!activity.user_id) {
        console.error('user_id is required for activity creation');
        return null;
      }

      const { data, error } = await supabase
        .from('activities')
        .insert([{
          ...activity,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating activity:', {
          error,
          details: error.details,
          hint: error.hint,
          message: error.message,
          code: error.code
        });
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in createActivity:', error);
      return null;
    }
  };

  const createDonorActivity = async (userId: string, action: 'added' | 'updated' | 'deleted', donorName: string): Promise<Activity | null> => {
    try {
      if (!userId) {
        console.error('userId is required for donor activity');
        return null;
      }

      return await createActivity({
        user_id: userId,
        type: `donor_${action}`,
        title: `Donor ${action}`,
        description: `${donorName} was ${action}`,
      });
    } catch (error) {
      console.error('Error creating donor activity:', error);
      return null;
    }
  };

  return {
    createActivity,
    createDonorActivity,
  };
}; 