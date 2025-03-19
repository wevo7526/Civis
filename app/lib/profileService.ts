import { SupabaseClient } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  organization_name: string | null;
  organization_type: string | null;
  mission_statement: string | null;
  tax_id: string | null;
  founding_year: number | null;
  organization_size: string | null;
  annual_budget: string | null;
  primary_cause: string | null;
  impact_areas: string[] | null;
  target_beneficiaries: string[] | null;
  programs: string[] | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  contact_name: string | null;
  contact_title: string | null;
  volunteer_needs: string[] | null;
  funding_sources: string[] | null;
  partnerships_desired: boolean | null;
  partnership_interests: string[] | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  last_active: string;
}

export interface ProfileFormData extends Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'last_active'> {}

export const createProfileService = (supabase: SupabaseClient) => {
  const getProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('organization_profiles')
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
        .from('organization_profiles')
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

  const uploadLogo = async (userId: string, file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('organization_logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('organization_logos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadLogo:', error);
      throw error;
    }
  };

  const updateOnboardingStep = async (userId: string, step: number): Promise<Profile> => {
    try {
      const { data, error } = await supabase
        .from('organization_profiles')
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
        .from('organization_profiles')
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
    uploadLogo,
    updateOnboardingStep,
    updateLastActive
  };
}; 