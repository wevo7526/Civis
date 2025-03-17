import { createClient } from '@supabase/supabase-js';
import { Grant, FundraisingCampaign } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AIInsights {
  recommendations: string[];
  risks: string[];
  opportunities: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on_hold' | 'planned' | 'cancelled';
  start_date: string;
  end_date: string;
  budget: number;
  impact_target: number;
  impact_current: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  aiInsights?: AIInsights;
  grant?: Grant;
  campaign?: FundraisingCampaign;
}

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getProject(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async addProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(project)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateImpact(id: string, impact: number): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update({ impact_current: impact })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProjectStatus(id: string, status: Project['status']): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}; 