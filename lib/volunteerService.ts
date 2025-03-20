import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Volunteer, VolunteerActivity, VolunteerHours } from './types';

export class VolunteerService {
  private supabase = createClientComponentClient();

  // Volunteer Management
  async getVolunteers(): Promise<Volunteer[]> {
    const { data, error } = await this.supabase
      .from('volunteers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getVolunteerById(id: string): Promise<Volunteer | null> {
    const { data, error } = await this.supabase
      .from('volunteers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createVolunteer(volunteer: Omit<Volunteer, 'id' | 'created_at' | 'updated_at' | 'total_hours'>): Promise<Volunteer> {
    const { data, error } = await this.supabase
      .from('volunteers')
      .insert([{
        ...volunteer,
        total_hours: 0,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateVolunteer(id: string, updates: Partial<Volunteer>): Promise<Volunteer> {
    const { data, error } = await this.supabase
      .from('volunteers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteVolunteer(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('volunteers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Activity Management
  async getActivities(filters?: {
    status?: VolunteerActivity['status'];
    upcoming?: boolean;
  }): Promise<VolunteerActivity[]> {
    let query = this.supabase
      .from('volunteer_activities')
      .select('*')
      .order('start_time', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.upcoming) {
      query = query.gte('start_time', new Date().toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getActivityById(id: string): Promise<VolunteerActivity | null> {
    const { data, error } = await this.supabase
      .from('volunteer_activities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createActivity(activity: Omit<VolunteerActivity, 'id' | 'created_at' | 'participant_ids'>): Promise<VolunteerActivity> {
    const { data, error } = await this.supabase
      .from('volunteer_activities')
      .insert([{
        ...activity,
        participant_ids: [],
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateActivity(id: string, updates: Partial<VolunteerActivity>): Promise<VolunteerActivity> {
    const { data, error } = await this.supabase
      .from('volunteer_activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteActivity(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('volunteer_activities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Activity Participation
  async joinActivity(activityId: string, userId: string): Promise<VolunteerActivity> {
    const { data: activity, error: fetchError } = await this.supabase
      .from('volunteer_activities')
      .select('*')
      .eq('id', activityId)
      .single();

    if (fetchError) throw fetchError;
    if (!activity) throw new Error('Activity not found');

    if (activity.participant_ids.includes(userId)) {
      throw new Error('User already joined this activity');
    }

    if (activity.participant_ids.length >= activity.max_participants) {
      throw new Error('Activity is already full');
    }

    const updatedParticipants = [...activity.participant_ids, userId];
    const status = updatedParticipants.length >= activity.max_participants ? 'filled' : 'open';

    const { data: updatedActivity, error: updateError } = await this.supabase
      .from('volunteer_activities')
      .update({
        participant_ids: updatedParticipants,
        status
      })
      .eq('id', activityId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedActivity;
  }

  async leaveActivity(activityId: string, userId: string): Promise<VolunteerActivity> {
    const { data: activity, error: fetchError } = await this.supabase
      .from('volunteer_activities')
      .select('*')
      .eq('id', activityId)
      .single();

    if (fetchError) throw fetchError;
    if (!activity) throw new Error('Activity not found');

    if (!activity.participant_ids.includes(userId)) {
      throw new Error('User is not part of this activity');
    }

    const updatedParticipants = activity.participant_ids.filter((id: string) => id !== userId);

    const { data: updatedActivity, error: updateError } = await this.supabase
      .from('volunteer_activities')
      .update({
        participant_ids: updatedParticipants,
        status: 'open'
      })
      .eq('id', activityId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedActivity;
  }

  // Hours Logging
  async logVolunteerHours(hours: Omit<VolunteerHours, 'id' | 'created_at'>): Promise<VolunteerHours> {
    const { data: loggedHours, error: logError } = await this.supabase
      .from('volunteer_hours')
      .insert([hours])
      .select()
      .single();

    if (logError) throw logError;

    // Update total hours for the volunteer
    const { data: volunteer } = await this.supabase
      .from('volunteers')
      .select('total_hours')
      .eq('id', hours.volunteer_id)
      .single();

    if (!volunteer) throw new Error('Volunteer not found');

    const { error: updateError } = await this.supabase
      .from('volunteers')
      .update({
        total_hours: (volunteer.total_hours || 0) + hours.hours,
        updated_at: new Date().toISOString(),
      })
      .eq('id', hours.volunteer_id);

    if (updateError) throw updateError;
    return loggedHours;
  }

  async getVolunteerHours(volunteerId: string): Promise<VolunteerHours[]> {
    const { data, error } = await this.supabase
      .from('volunteer_hours')
      .select('*')
      .eq('volunteer_id', volunteerId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Statistics
  async getVolunteerStats(): Promise<{
    total: number;
    active: number;
    totalHours: number;
    uniqueSkills: number;
  }> {
    const { data: volunteers, error } = await this.supabase
      .from('volunteers')
      .select('status, total_hours, skills');

    if (error) throw error;

    const uniqueSkills = new Set(volunteers?.flatMap(v => v.skills) || []);

    return {
      total: volunteers?.length || 0,
      active: volunteers?.filter(v => v.status === 'active').length || 0,
      totalHours: volunteers?.reduce((sum, v) => sum + (v.total_hours || 0), 0) || 0,
      uniqueSkills: uniqueSkills.size,
    };
  }
}

// Export a singleton instance
export const volunteerService = new VolunteerService(); 