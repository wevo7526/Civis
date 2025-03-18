import { supabase } from './supabase';

export const createDonorActivity = async (userId: string, action: 'added' | 'updated' | 'deleted', donorName: string) => {
  const title = `Donor ${action}`;
  const description = `${donorName} was ${action}`;
  const { data, error } = await supabase
    .from('activities')
    .insert([
      {
        user_id: userId,
        type: 'donor',
        title,
        description,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating donor activity:', error);
    throw error;
  }

  return data;
}; 