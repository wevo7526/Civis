'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface Reminder {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'overdue';
  category: 'task' | 'workflow' | 'notification';
  notification_sent: boolean;
  reminder_frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
  reminder_count?: number;
  max_reminders?: number;
  workflow_id?: string;
}

interface RemindersContextType {
  reminders: Reminder[];
  loading: boolean;
  error: Error | null;
  createReminder: (reminder: Omit<Reminder, 'id'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  markAsCompleted: (id: string) => Promise<void>;
  markAsCancelled: (id: string) => Promise<void>;
  refreshReminders: () => Promise<void>;
}

const RemindersContext = createContext<RemindersContextType | undefined>(undefined);

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const fetchReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch reminders'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();

    // Set up real-time subscription for reminders
    const channel = supabase
      .channel('reminders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reminders',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReminders(prev => [...prev, payload.new as Reminder]);
          } else if (payload.eventType === 'UPDATE') {
            setReminders(prev =>
              prev.map(reminder =>
                reminder.id === payload.new.id
                  ? { ...reminder, ...payload.new }
                  : reminder
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setReminders(prev =>
              prev.filter(reminder => reminder.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createReminder = async (reminder: Omit<Reminder, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reminders')
        .insert({
          ...reminder,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setReminders(prev => [...prev, data]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create reminder'));
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  };

  const markAsCompleted = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;

      setReminders(prev =>
        prev.map(reminder =>
          reminder.id === id
            ? { ...reminder, status: 'completed' }
            : reminder
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update reminder'));
    }
  };

  const markAsCancelled = async (id: string) => {
    await updateReminder(id, { status: 'overdue' });
  };

  const value = {
    reminders,
    loading,
    error,
    createReminder,
    updateReminder,
    deleteReminder,
    markAsCompleted,
    markAsCancelled,
    refreshReminders: fetchReminders,
  };

  return (
    <RemindersContext.Provider value={value}>
      {children}
    </RemindersContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(RemindersContext);
  if (context === undefined) {
    throw new Error('useReminders must be used within a RemindersProvider');
  }
  return context;
} 