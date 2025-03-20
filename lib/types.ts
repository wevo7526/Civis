export interface Project {
  id: string;
  user_id?: string;
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
  phone?: string;
  status: 'active' | 'inactive';
  skills: string[];
  interests: string[];
  total_hours: number;
  availability: {
    weekdays: string[];
    weekends: boolean;
    hours: {
      morning: boolean;
      afternoon: boolean;
      evening: boolean;
    };
  };
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

export interface AIResponse {
  success: boolean;
  message?: string;
  content: string;
  data?: any;
} 