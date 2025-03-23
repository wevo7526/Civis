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
  status: 'active' | 'completed' | 'on_hold' | 'planning';
  start_date: string;
  end_date: string;
  budget: number;
  impact_target: string;
  impact_metric: string;
  team_size: number;
  team_roles: string[];
  impact_current: number;
  timeline: string;
  goals: string[];
  grant?: {
    title: string;
    organization: string;
    amount: number;
    deadline: string;
    status: 'draft' | 'submitted' | 'awarded' | 'rejected';
    description: string;
    impact_statement: string;
    budget: number;
    progress: {
      proposal_status: 'not_started' | 'in_progress' | 'completed' | 'reviewed';
      last_updated: string;
      next_deadline: string;
      sections_completed: number;
      total_sections: number;
      review_notes: string;
    };
  };
  campaign?: {
    type: 'annual' | 'capital' | 'emergency' | 'program';
    goal: number;
    end_date: string;
  };
  created_at: string;
  updated_at: string;
  user_id: string;
}

export type CampaignStatus = 'planning' | 'active' | 'completed' | 'on-hold';

export interface CampaignItem {
  id: string;
  name: string;
  description: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  target_amount: number;
  current_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  items: CampaignItem[];
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

export interface AIResponse {
  success: boolean;
  content: string;
  error?: string;
} 