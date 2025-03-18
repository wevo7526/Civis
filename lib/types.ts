export interface Project {
  id?: string;
  user_id?: string;
  name: string;
  description: string;
  goals: string[];
  budget: number;
  timeline: string;
  organization_info?: string;
  budget_breakdown?: string;
  evaluation_metrics?: string;
  sustainability_plan?: string;
  created_at?: string;
  updated_at?: string;
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