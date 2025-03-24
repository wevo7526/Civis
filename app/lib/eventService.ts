import { SupabaseClient } from '@supabase/supabase-js';
import { Event } from './types';

export const createEventService = (supabase: SupabaseClient) => {
  const getEvents = async (): Promise<Event[]> => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in getEvents:', error);
      return [];
    }
  };

  const addEvent = async (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event | null> => {
    try {
      const cleanEvent = {
        ...event,
        name: event.name.trim(),
        description: event.description.trim(),
        location: event.location.trim(),
        date: event.date,
        type: event.type,
        status: event.status,
        budget: Number(event.budget),
        target_attendees: Number(event.target_attendees),
        user_id: event.user_id,
        volunteer_hours: event.volunteer_hours || {},
        volunteer_ids: event.volunteer_ids || [],
        max_volunteers: event.max_volunteers,
        amount_raised: event.amount_raised || 0,
        fundraising_goal: event.fundraising_goal,
        actual_attendees: event.actual_attendees ? Number(event.actual_attendees) : null,
        total_revenue: event.total_revenue ? Number(event.total_revenue) : null,
        total_expenses: event.total_expenses ? Number(event.total_expenses) : null,
        expenses_breakdown: event.expenses_breakdown || null,
        net_profit: event.net_profit ? Number(event.net_profit) : null,
        roi_percentage: event.roi_percentage ? Number(event.roi_percentage) : null,
        impact_metrics: event.impact_metrics || null,
      };

      const { data, error } = await supabase
        .from('events')
        .insert([cleanEvent])
        .select()
        .single();

      if (error) {
        console.error('Error adding event:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in addEvent:', error);
      return null;
    }
  };

  const updateEvent = async (id: string, event: Partial<Event>): Promise<Event | null> => {
    try {
      // Clean up the event data
      const cleanEvent = {
        ...event,
        name: event.name?.trim(),
        description: event.description?.trim(),
        location: event.location?.trim(),
        budget: event.budget ? Number(event.budget) : undefined,
        target_attendees: event.target_attendees ? Number(event.target_attendees) : undefined,
        actual_attendees: event.actual_attendees ? Number(event.actual_attendees) : undefined,
        total_revenue: event.total_revenue ? Number(event.total_revenue) : undefined,
        total_expenses: event.total_expenses ? Number(event.total_expenses) : undefined,
        expenses_breakdown: event.expenses_breakdown || undefined,
        net_profit: event.net_profit ? Number(event.net_profit) : undefined,
        roi_percentage: event.roi_percentage ? Number(event.roi_percentage) : undefined,
        impact_metrics: event.impact_metrics || undefined,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('events')
        .update(cleanEvent)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating event:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateEvent:', error);
      return null;
    }
  };

  const deleteEvent = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      return false;
    }
  };

  const calculateEventMetrics = (event: Event): Event => {
    // Calculate total expenses from breakdown
    if (event.expenses_breakdown) {
      event.total_expenses = event.expenses_breakdown.reduce((sum, expense) => sum + expense.amount, 0);
    }

    // Calculate net profit
    if (event.total_revenue !== undefined && event.total_expenses !== undefined) {
      event.net_profit = event.total_revenue - event.total_expenses;
    }

    // Calculate ROI percentage
    if (event.net_profit !== undefined && event.total_expenses !== undefined && event.total_expenses > 0) {
      event.roi_percentage = (event.net_profit / event.total_expenses) * 100;
    }

    return event;
  };

  return {
    getEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    calculateEventMetrics,
  };
}; 