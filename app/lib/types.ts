import type {
  AIResponse,
  Donor
} from '@/lib/types';

export type {
  AIResponse,
  Donor
};

export interface NextPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface WritingItem {
  id: string;
  title: string;
  content: string;
  type: 'grant' | 'fundraising';
  project_id: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Grant {
  id: string;
  title: string;
  organization: string;
  amount: number;
  deadline: string;
  status: 'draft' | 'submitted' | 'awarded' | 'rejected';
  description: string;
  impact_statement: string;
  budget: number;
  created_at: string;
  updated_at: string;
  user_id: string;
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

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  type: 'fundraiser' | 'volunteer' | 'community' | 'other';
  status: 'active' | 'planned' | 'completed' | 'cancelled';
  budget: number;
  target_attendees: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  volunteer_hours?: { [key: string]: number };
  volunteer_ids?: string[];
  max_volunteers?: number;
  amount_raised?: number;
  fundraising_goal?: number;
  actual_attendees?: number;
  total_revenue?: number;
  total_expenses?: number;
  expenses_breakdown?: Array<{ category: string; amount: number }>;
  net_profit?: number;
  roi_percentage?: number;
  impact_metrics?: {
    engagement: number;
    satisfaction: number;
    community_impact: number;
  };
}

export interface Program {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'planned';
  budget: number;
  target_impact: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CommunityStakeholder {
  id: string;
  name: string;
  organization: string;
  role: string;
  contact_info: string;
  type: 'partner' | 'funder' | 'volunteer' | 'beneficiary' | 'other';
  engagement_level: number;
  created_at: string;
  updated_at: string;
  user_id: string;
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

export type CampaignStatus = 'planning' | 'active' | 'completed' | 'on-hold';

export interface CampaignItem {
  id: string;
  campaign_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string;
  dependencies: string[];
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: CampaignStatus;
  budget: number;
  impact_target: string;
  impact_metric: string;
  created_at: string;
  updated_at: string;
  items: CampaignItem[];
  user_id: string;
}

export interface GrantSection {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  last_updated: string;
}

export interface GrantDocument {
  id: string;
  project_id: string;
  title: string;
  type: 'standard' | 'custom';
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  success_status?: 'successful' | 'unsuccessful' | null;
  sections: GrantSection[];
  created_at: string;
  updated_at: string;
}

export interface FundraisingStrategy {
  id: string;
  name: string;
  description: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  type: 'individual' | 'corporate' | 'grant' | 'event' | 'crowdfunding';
  progress: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  metrics?: {
    donor_count?: number;
    average_donation?: number;
    conversion_rate?: number;
    engagement_rate?: number;
  };
  insights?: {
    performance_analysis?: string;
    trend_analysis?: string;
    risk_assessment?: string;
    opportunity_analysis?: string;
  };
  recommendations?: {
    short_term?: string[];
    long_term?: string[];
    priority_actions?: string[];
  };
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

export interface AIInsights {
  recommendations: string[];
  risks: string[];
  opportunities: string[];
}

export interface Activity {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateActivityParams {
  user_id: string;
  type: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
} 