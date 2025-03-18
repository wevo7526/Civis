import { SupabaseClient } from '@supabase/supabase-js';
import { Campaign, CampaignItem } from './types';

export const createCampaignService = (supabase: SupabaseClient) => {
  const getCampaigns = async (): Promise<Campaign[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      if (!campaigns || campaigns.length === 0) {
        return [];
      }

      const { data: items, error: itemsError } = await supabase
        .from('campaign_items')
        .select('*')
        .in('campaign_id', campaigns.map(c => c.id));

      if (itemsError) throw itemsError;

      return campaigns.map(campaign => ({
        ...campaign,
        items: items?.filter(item => item.campaign_id === campaign.id) || []
      }));
    } catch (error) {
      console.error('Error in getCampaigns:', error);
      throw error;
    }
  };

  const addCampaign = async (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'items'>): Promise<Campaign> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Explicitly pick only the fields that exist in the database
      const campaignData = {
        name: campaign.name,
        description: campaign.description,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        status: campaign.status,
        budget: campaign.budget,
        impact_target: campaign.impact_target,
        impact_metric: campaign.impact_metric,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) throw error;
      return { ...data, items: [] };
    } catch (error) {
      console.error('Error in addCampaign:', error);
      throw error;
    }
  };

  const updateCampaign = async (id: string, campaign: Partial<Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'items'>>): Promise<Campaign> => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update(campaign)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const { data: items } = await supabase
        .from('campaign_items')
        .select('*')
        .eq('campaign_id', id);

      return { ...data, items: items || [] };
    } catch (error) {
      console.error('Error in updateCampaign:', error);
      throw error;
    }
  };

  const deleteCampaign = async (id: string): Promise<boolean> => {
    try {
      // First delete all campaign items
      const { error: itemsError } = await supabase
        .from('campaign_items')
        .delete()
        .eq('campaign_id', id);

      if (itemsError) throw itemsError;

      // Then delete the campaign
      const { error: campaignError } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (campaignError) throw campaignError;
      return true;
    } catch (error) {
      console.error('Error in deleteCampaign:', error);
      throw error;
    }
  };

  const addCampaignItem = async (campaignId: string, item: Omit<CampaignItem, 'id' | 'campaign_id' | 'created_at' | 'updated_at'>): Promise<CampaignItem> => {
    try {
      const { data, error } = await supabase
        .from('campaign_items')
        .insert([{ ...item, campaign_id: campaignId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in addCampaignItem:', error);
      throw error;
    }
  };

  const updateCampaignItem = async (id: string, item: Partial<Omit<CampaignItem, 'id' | 'campaign_id' | 'created_at' | 'updated_at'>>): Promise<CampaignItem> => {
    try {
      const { data, error } = await supabase
        .from('campaign_items')
        .update(item)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updateCampaignItem:', error);
      throw error;
    }
  };

  const deleteCampaignItem = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('campaign_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in deleteCampaignItem:', error);
      throw error;
    }
  };

  return {
    getCampaigns,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    addCampaignItem,
    updateCampaignItem,
    deleteCampaignItem
  };
}; 