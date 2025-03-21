export interface Project {
  id: string;
  user_id?: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  budget: number;
  start_date: string;
  end_date: string;
  impact_target: string;
  impact_metric: string;
  team_size: number;
  team_roles: string[];
  goals: string[];
  timeline: string;
  organization_info?: string;
  budget_breakdown?: string;
  evaluation_metrics?: string;
  sustainability_plan?: string;
  created_at: string;
  updated_at: string;
}

export interface GrantProposal {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  automation_status: 'active' | 'inactive';
  last_generated: string | null;
  next_review: string | null;
  created_at: string;
  updated_at: string;
}

export interface Volunteer {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  skills: string[];
  interests: string[];
  availability: {
    weekdays: boolean;
    weekends: boolean;
    hours: string;
  };
  total_hours: number;
  created_at: string;
  updated_at: string;
}

export interface VolunteerActivity {
  id: string;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  organizer_id: string;
  participant_ids: string[];
  status: 'open' | 'filled' | 'completed' | 'cancelled';
  created_at: string;
}

export interface VolunteerHours {
  id: string;
  volunteer_id: string;
  activity_id?: string;
  hours: number;
  description: string;
  date: string;
  created_at: string;
}

export interface AIRequest {
  action: 
    | 'chat'
    | 'analyze_donors'
    | 'analyze_projects'
    | 'analyze_events'
    | 'generate_content'
    | 'generate_donor_report'
    | 'generate_grant_proposal'
    | 'optimize_event_plan'
    | 'assess_program_impact'
    | 'generate_stakeholder_update'
    | 'generate_fundraising_strategy'
    | 'generateOutreachMessage'
    | 'analyzeDonorEngagement'
    | 'matchVolunteers'
    | 'optimizeEventPlan'
    | 'assessProgramImpact'
    | 'analyzeCommunityEngagement'
    | 'analyzeProjects'
    | 'analyzeEvents'
    | 'analyzeFundraising'
    | 'generateDonorMessage';
  data: unknown;
  context?: Record<string, unknown>;
}

export interface AIResponse {
  success: boolean;
  message: string;
  content: string;
  data: Record<string, unknown>;
}

export interface DonorAnalysisData {
  id: string;
  name: string;
  email: string;
  donation_history: Array<{
    date: string;
    amount: number;
    campaign: string;
  }>;
  engagement_metrics: {
    last_interaction: string;
    total_donations: number;
    average_donation: number;
  };
}

export interface ProjectAnalysisData {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  timeline: {
    start_date: string;
    end_date: string;
    milestones: Array<{
      date: string;
      description: string;
      status: string;
    }>;
  };
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
  };
}

export interface EventAnalysisData {
  id: string;
  name: string;
  type: string;
  date: string;
  status: string;
  attendance: {
    expected: number;
    actual: number;
  };
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
  };
  metrics: {
    engagement: number;
    satisfaction: number;
    fundraising_goal: number;
    actual_raised: number;
  };
}

export interface Event {
  id: string;
  user_id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  type: 'fundraiser' | 'volunteer' | 'community' | 'other';
  status: 'active' | 'completed' | 'planned' | 'cancelled';
  created_at: string;
  updated_at: string;
  max_volunteers?: number;
  volunteer_ids?: string[];
  volunteer_hours?: { [key: string]: number };
  budget?: number;
  amount_raised?: number;
  fundraising_goal?: number;
}

export interface Donor {
  id: string;
  name: string;
  email: string;
  amount: number;
  last_donation?: string;
  donation_date?: string;
  last_contact?: string;
  created_at: string;
  engagement?: number;
}

export interface Grant {
  id: string;
  project_id: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  budget: number;
  target_impact: string;
  created_at: string;
  updated_at: string;
}

export interface CommunityStakeholder {
  id: string;
  name: string;
  type: 'individual' | 'organization' | 'government';
  contact_info: string;
  engagement_level: 'high' | 'medium' | 'low';
  interests: string[];
  created_at: string;
  updated_at: string;
}

export interface FundraisingCampaign {
  id: string;
  name: string;
  description: string;
  goal: number;
  raised: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'planned';
  created_at: string;
  updated_at: string;
} 