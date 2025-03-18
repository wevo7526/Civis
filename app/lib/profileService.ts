import { SupabaseClient } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  bio: string | null;
  interests: string[] | null;
  skills: string[] | null;
  goals: string[] | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  role: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
  preferred_communication: string | null;
  availability: string | null;
  timezone: string | null;
  last_active: string;
  email: string | null;
}

export interface ProfileFormData extends Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'last_active'> {}

export const createProfileService = (supabase: SupabaseClient) => {
  const getProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  };

  const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  };

  const uploadAvatar = async (userId: string, file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      throw error;
    }
  };

  const updateOnboardingStep = async (userId: string, step: number): Promise<Profile> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_step: step,
          onboarding_completed: step >= 5 // Assuming 5 is the final step
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updateOnboardingStep:', error);
      throw error;
    }
  };

  const updateLastActive = async (userId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ last_active: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error in updateLastActive:', error);
      throw error;
    }
  };

  return {
    getProfile,
    updateProfile,
    uploadAvatar,
    updateOnboardingStep,
    updateLastActive
  };
}; 