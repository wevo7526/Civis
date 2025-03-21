export interface Project {
  id?: string;
  name?: string;
  description?: string;
  goals?: string[];
  budget?: number;
  timeline?: string;
  impact_target?: string;
  impact_metric?: string;
  team_size?: number;
  team_roles?: string[];
  status?: 'planning' | 'active' | 'completed' | 'on_hold';
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
  organization_id?: string;
  grant_id?: string;
  grant_amount?: number;
  grant_status?: 'pending' | 'approved' | 'rejected';
  grant_deadline?: string;
  grant_requirements?: string[];
  grant_reporting_schedule?: string[];
  grant_reporting_metrics?: string[];
  grant_reporting_dates?: string[];
  grant_reporting_status?: 'on_track' | 'at_risk' | 'behind';
  grant_reporting_notes?: string[];
  grant_reporting_attachments?: string[];
  grant_reporting_submissions?: {
    date: string;
    type: string;
    content: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    feedback?: string;
  }[];
  grant_reporting_requirements?: {
    type: string;
    due_date: string;
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
    content?: string;
    feedback?: string;
  }[];
  grant_reporting_history?: {
    date: string;
    type: string;
    content: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    feedback?: string;
  }[];
  grant_reporting_attachments_history?: {
    date: string;
    type: string;
    url: string;
    name: string;
    size: number;
  }[];
  grant_reporting_comments?: {
    date: string;
    user: string;
    content: string;
    type: 'internal' | 'external';
  }[];
  grant_reporting_reminders?: {
    date: string;
    type: string;
    content: string;
    status: 'pending' | 'sent' | 'acknowledged';
  }[];
  grant_reporting_notifications?: {
    date: string;
    type: string;
    content: string;
    status: 'pending' | 'sent' | 'acknowledged';
  }[];
  grant_reporting_audit_trail?: {
    date: string;
    user: string;
    action: string;
    details: string;
  }[];
  grant_reporting_settings?: {
    notifications_enabled: boolean;
    reminder_frequency: string;
    reporting_template: string;
    custom_fields: string[];
  };
  grant_reporting_analytics?: {
    submission_rate: number;
    approval_rate: number;
    average_response_time: number;
    compliance_score: number;
  };
  grant_reporting_summary?: {
    total_submissions: number;
    approved_submissions: number;
    pending_submissions: number;
    rejected_submissions: number;
    next_due_date: string;
    overall_status: 'on_track' | 'at_risk' | 'behind';
  };
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
  data?: {
    analyzedItems?: number;
    timestamp?: string;
    estimatedAmount?: number;
    timeline?: string[];
    recommendations?: string[];
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