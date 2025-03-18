import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CreateActivityParams {
  userId: string;
  type: string;
  title: string;
  description: string;
}

export const createActivity = async ({ userId, type, title, description }: CreateActivityParams) => {
  const { data, error } = await supabase
    .from('activities')
    .insert([
      {
        user_id: userId,
        type,
        title,
        description,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating activity:', error);
    throw error;
  }

  return data;
}; 