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
  type: 'fundraiser' | 'volunteer' | 'community' | 'other';
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  budget: number;
  target_attendees: number;
  created_at: string;
  updated_at: string;
  user_id: string;
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