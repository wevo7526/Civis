'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  BellIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface GrantReminder {
  id: string;
  type: 'deadline' | 'progress' | 'report';
  status: 'active' | 'inactive';
  schedule: string;
  template: string;
  lastSent?: string;
  nextSend?: string;
}

export default function GrantReminders() {
  const [reminders, setReminders] = useState<GrantReminder[]>([
    {
      id: 'deadline',
      type: 'deadline',
      status: 'inactive',
      schedule: 'weekly',
      template: 'Reminder: The grant application for ${grant_name} is due on ${deadline}.',
    },
    {
      id: 'progress',
      type: 'progress',
      status: 'inactive',
      schedule: 'monthly',
      template: 'Progress Update: Here\'s how we\'re using the ${grant_name} funding to achieve our goals.',
    },
    {
      id: 'report',
      type: 'report',
      status: 'inactive',
      schedule: 'quarterly',
      template: 'Grant Report: Here\'s our quarterly report on the impact of ${grant_name} funding.',
    },
  ]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchReminderStatus();
  }, []);

  const fetchReminderStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: workflows, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'grant-reminders');

      if (error) throw error;

      // Update reminder statuses based on workflows
      setReminders(prevReminders => 
        prevReminders.map(reminder => {
          const workflow = workflows.find(w => w.config.type === reminder.type);
          return {
            ...reminder,
            status: workflow?.status || 'inactive',
            lastSent: workflow?.last_run,
            nextSend: workflow?.next_run,
          };
        })
      );
    } catch (error) {
      console.error('Error fetching reminder status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (reminderId: string) => {
    try {
      const reminder = reminders.find(r => r.id === reminderId);
      if (!reminder) return;

      const newStatus = reminder.status === 'active' ? 'inactive' : 'active';
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update in database
      const { data: workflow, error } = await supabase
        .from('automation_workflows')
        .upsert({
          user_id: user.id,
          type: 'grant-reminders',
          status: newStatus,
          config: {
            type: reminder.type,
            schedule: reminder.schedule,
            template: reminder.template,
          },
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // If activating, start the workflow
      if (newStatus === 'active' && workflow) {
        const response = await fetch('/api/automation/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ workflowId: workflow.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to start workflow');
        }
      }

      // Update local state
      setReminders(prevReminders =>
        prevReminders.map(r =>
          r.id === reminderId ? { ...r, status: newStatus } : r
        )
      );
    } catch (error) {
      console.error('Error toggling reminder status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Grant Reminders</h1>
          <p className="text-gray-500">Configure automated grant deadline notifications and updates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <BellIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {reminder.type === 'deadline'
                      ? 'Deadline Reminders'
                      : reminder.type === 'progress'
                      ? 'Progress Updates'
                      : 'Grant Reports'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {reminder.type === 'deadline'
                      ? 'Automated reminders for upcoming grant deadlines'
                      : reminder.type === 'progress'
                      ? 'Regular updates on grant-funded projects'
                      : 'Scheduled grant impact and financial reports'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggleStatus(reminder.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  reminder.status === 'active'
                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {reminder.status === 'active' ? 'Active' : 'Inactive'}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Schedule</label>
                <select
                  value={reminder.schedule}
                  onChange={(e) => {
                    // Update schedule in database and local state
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Message Template</label>
                <textarea
                  value={reminder.template}
                  onChange={(e) => {
                    // Update template in database and local state
                  }}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {reminder.lastSent && (
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Last sent: {new Date(reminder.lastSent).toLocaleDateString()}</span>
                  </div>
                )}
                {reminder.nextSend && (
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Next send: {new Date(reminder.nextSend).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 