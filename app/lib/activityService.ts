import { SupabaseClient } from '@supabase/supabase-js';

interface Activity {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface CreateActivityParams {
  user_id: string;
  type: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
}

export const createActivityService = (supabase: SupabaseClient) => {
  const createActivity = async (params: CreateActivityParams): Promise<Activity | null> => {
    try {
      // Ensure user_id is present
      if (!params.user_id) {
        console.error('user_id is required for activity creation');
        return null;
      }

      // Get the current user to verify
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        return null;
      }
      if (!user) {
        console.error('No authenticated user found');
        return null;
      }

      // Verify the user_id matches the authenticated user
      if (params.user_id !== user.id) {
        console.error('User ID mismatch');
        return null;
      }

      const { data, error } = await supabase
        .from('activities')
        .insert([{
          ...params,
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
      console.error('Error creating activity:', error);
      return null;
    }
  };

  const createDonorActivity = async (user_id: string, action: 'added' | 'updated' | 'deleted', donorName: string) => {
    try {
      if (!user_id) {
        console.error('user_id is required for donor activity');
        return null;
      }

      return await createActivity({
        user_id,
        type: `donor_${action}`,
        title: `Donor ${action}`,
        description: `${donorName} was ${action}`,
      });
    } catch (error) {
      console.error('Error creating donor activity:', error);
      return null;
    }
  };

  // Helper function to create event-related activities
  const createEventActivity = async (user_id: string, action: 'created' | 'updated' | 'cancelled', eventTitle: string) => {
    try {
      return await createActivity({
        type: `event_${action}`,
        title: `Event ${action}`,
        description: `Event "${eventTitle}" was ${action}`,
        user_id,
      });
    } catch (error) {
      console.error('Error creating event activity:', error);
      return null;
    }
  };

  // Helper function to create campaign-related activities
  const createCampaignActivity = async (user_id: string, action: 'created' | 'updated' | 'completed', campaignName: string) => {
    try {
      return await createActivity({
        type: `campaign_${action}`,
        title: `Campaign ${action}`,
        description: `Campaign "${campaignName}" was ${action}`,
        user_id,
      });
    } catch (error) {
      console.error('Error creating campaign activity:', error);
      return null;
    }
  };

  // Helper function to create document-related activities
  const createDocumentActivity = async (user_id: string, action: 'created' | 'updated' | 'deleted', documentTitle: string) => {
    try {
      return await createActivity({
        type: `document_${action}`,
        title: `Document ${action}`,
        description: `Document "${documentTitle}" was ${action}`,
        user_id,
      });
    } catch (error) {
      console.error('Error creating document activity:', error);
      return null;
    }
  };

  // Helper function to create workflow-related activities
  const createWorkflowActivity = async (user_id: string, action: 'started' | 'completed' | 'failed', workflowType: string) => {
    try {
      return await createActivity({
        type: `workflow_${action}`,
        title: `Workflow ${action}`,
        description: `${workflowType} workflow ${action}`,
        user_id,
      });
    } catch (error) {
      console.error('Error creating workflow activity:', error);
      return null;
    }
  };

  // Helper function to create grant-related activities
  const createGrantActivity = async (user_id: string, action: 'reminder' | 'submitted' | 'approved' | 'rejected', grantTitle: string) => {
    try {
      return await createActivity({
        type: action === 'reminder' ? 'grant_reminder' : `grant_${action}`,
        title: action === 'reminder' ? 'Grant Deadline Reminder' : `Grant ${action}`,
        description: action === 'reminder' 
          ? `Reminder: Grant "${grantTitle}" deadline is approaching`
          : `Grant "${grantTitle}" was ${action}`,
        user_id,
      });
    } catch (error) {
      console.error('Error creating grant activity:', error);
      return null;
    }
  };

  // Helper function to create impact report activities
  const createImpactReportActivity = async (user_id: string, action: 'generated' | 'shared', reportTitle: string) => {
    try {
      return await createActivity({
        type: 'impact_report',
        title: `Impact Report ${action}`,
        description: `Impact report "${reportTitle}" was ${action}`,
        user_id,
      });
    } catch (error) {
      console.error('Error creating impact report activity:', error);
      return null;
    }
  };

  return {
    createActivity,
    createDonorActivity,
    createEventActivity,
    createCampaignActivity,
    createDocumentActivity,
    createWorkflowActivity,
    createGrantActivity,
    createImpactReportActivity,
  };
}; 