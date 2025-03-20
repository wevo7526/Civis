import { SupabaseClient } from '@supabase/supabase-js';

export interface Activity {
  user_id: string;
  type: string;
  title: string;
  description: string;
}

export const createActivityService = (supabase: SupabaseClient) => {
  const createActivity = async (activity: Activity) => {
    const { data, error } = await supabase
      .from('activities')
      .insert([{
        ...activity,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating activity:', error);
      throw error;
    }

    return data;
  };

  const createDonorActivity = async (userId: string, action: 'added' | 'updated' | 'deleted', donorName: string) => {
    return createActivity({
      user_id: userId,
      type: 'donor',
      title: `Donor ${action}`,
      description: `${donorName} was ${action}`,
    });
  };

  return {
    createActivity,
    createDonorActivity,
  };
}; 