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
  name: string;
  email: string;
  phone: string;
  skills: string[];
  interests: string[];
  availability: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  type: 'fundraiser' | 'volunteer' | 'community' | 'awareness';
  budget: number;
  target_attendees: number;
  status: 'planned' | 'upcoming' | 'completed' | 'cancelled';
  user_id: string;
  created_at: string;
  updated_at: string;
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
  goal: number;
  current_amount: number;
  start_date: string;
  end_date: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  type: 'annual' | 'capital' | 'emergency' | 'program';
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Donor {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  donation_date: string;
  amount: number;
  status: 'active' | 'inactive';
  notes?: string;
  created_at: string;
  updated_at: string;
  last_donation?: string;
  engagement?: number;
  last_contact?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  budget: number;
  start_date: string;
  end_date: string;
  impact_target: string;
  impact_metric: string;
  team_size: number;
  team_roles: string[];
  goals: string[];
  timeline: string;
  impact_current: number;
  grant?: {
    title: string;
    organization: string;
    amount: number;
    deadline: string;
    status: string;
    description: string;
    impact_statement: string;
    budget: number;
  };
  campaign?: {
    name: string;
    description: string;
    goal: number;
    current_amount: number;
    start_date: string;
    end_date: string;
    status: string;
    type: string;
  };
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
  status: CampaignStatus;
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
  user_id: string;
  items: CampaignItem[];
}

export interface FundraisingStrategy {
  id: string;
  organization_name: string;
  organization_type: string;
  target_amount: number;
  timeframe: string;
  current_donors: number;
  status: 'draft' | 'active' | 'completed' | 'paused';
  progress: number;
  insights: string[];
  recommendations: string[];
  strategy_content: string;
  mission: string;
  previous_fundraising: string;
  key_programs: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  related_strategy_id?: string; // For linking to the main strategy page
}

export interface StrategyInsight {
  id: string;
  strategy_id: string;
  content: string;
  type: 'insight' | 'recommendation';
  created_at: string;
  updated_at: string;
}

export interface FundraisingMetric {
  id: string;
  strategy_id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  created_at: string;
  updated_at: string;
} 