import { SupabaseClient } from '@supabase/supabase-js';

interface CreateActivityParams {
  type: string;
  title: string;
  description: string;
  user_id: string;
}

export const createActivityService = (supabase: SupabaseClient) => {
  const createActivity = async (params: CreateActivityParams) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([{
          ...params,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating activity:', error);
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
      return await createActivity({
        type: `donor_${action}`,
        title: `Donor ${action}`,
        description: `${donorName} was ${action}`,
        user_id,
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
    return createActivity({
      type: `workflow_${action}`,
      title: `Workflow ${action}`,
      description: `${workflowType} workflow ${action}`,
      user_id,
    });
  };

  // Helper function to create grant-related activities
  const createGrantActivity = async (user_id: string, action: 'reminder' | 'submitted' | 'approved' | 'rejected', grantTitle: string) => {
    return createActivity({
      type: action === 'reminder' ? 'grant_reminder' : `grant_${action}`,
      title: action === 'reminder' ? 'Grant Deadline Reminder' : `Grant ${action}`,
      description: action === 'reminder' 
        ? `Reminder: Grant "${grantTitle}" deadline is approaching`
        : `Grant "${grantTitle}" was ${action}`,
      user_id,
    });
  };

  // Helper function to create impact report activities
  const createImpactReportActivity = async (user_id: string, action: 'generated' | 'shared', reportTitle: string) => {
    return createActivity({
      type: 'impact_report',
      title: `Impact Report ${action}`,
      description: `Impact report "${reportTitle}" was ${action}`,
      user_id,
    });
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