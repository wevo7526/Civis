export interface Project {
  id: string;
  name: string;
  description: string;
  mission: string;
  goals: string[];
  target_audience: string;
  location: string;
  timeline: string;
  budget: number;
  status: 'planning' | 'active' | 'completed' | 'on_hold';
  start_date: string;
  end_date: string;
  impact_target: string;
  impact_metric: string;
  team_size: number;
  team_roles: string[];
  grant_status?: 'pending' | 'approved' | 'rejected';
  grant_amount?: number;
  grant_deadline?: string;
  campaign_type?: 'annual' | 'capital' | 'emergency' | 'program';
  campaign_goal?: number;
  campaign_deadline?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
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

export type AIRequest = 
  | 'analyze_donors'
  | 'analyzeDonorEngagement'
  | 'generate_donor_report'
  | 'generateOutreachMessage'
  | 'generateDonorMessage'
  | 'analyzeProjects'
  | 'analyzeEvents'
  | 'optimizeEventPlan'
  | 'assessProgramImpact'
  | 'analyzeCommunityEngagement'
  | 'matchVolunteers'
  | 'analyzeFundraising'
  | 'generate_grant_proposal'
  | 'generate_fundraising_strategy'
  | 'review_grant_proposal'
  | 'optimize_fundraising_strategy'
  | 'generate_grant_budget'
  | 'generate_fundraising_timeline';

export interface AIResponse {
  success: boolean;
  content: string;
  message?: string;
  data?: {
    analyzedItems?: number;
    timestamp?: string;
    estimatedAmount?: number;
    timeline?: string[];
    recommendations?: string[];
    [key: string]: any;
  };
  error?: string;
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
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  total_given: number;
  last_gift_amount?: number;
  last_gift_date?: string;
  preferred_communication?: 'email' | 'phone' | 'mail';
  notes?: string;
  donation_date: string;
  amount: number;
  created_at: string;
  updated_at: string;
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
  type: 'annual' | 'capital' | 'emergency' | 'program';
  goal: number;
  current_amount: number;
  start_date: string;
  end_date: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  target_audience: string;
  campaign_strategy: string;
  success_metrics: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface StructuredResponse {
  type: 'analysis' | 'recommendations' | 'insights' | 'metrics';
  data: any;
}

export interface StreamResponse {
  success: boolean;
  content: string;
  structuredData?: StructuredResponse[];
  error?: string;
} 