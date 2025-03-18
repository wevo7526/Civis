'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface DonorCommunication {
  id: string;
  type: 'thank_you' | 'impact_update';
  status: 'active' | 'inactive';
  schedule: string;
  template: string;
  lastSent?: string;
  nextSend?: string;
}

export default function DonorCommunications() {
  const [communications, setCommunications] = useState<DonorCommunication[]>([
    {
      id: 'thank-you',
      type: 'thank_you',
      status: 'inactive',
      schedule: 'immediate',
      template: 'Thank you for your generous donation of ${amount}. Your support helps us make a difference.',
    },
    {
      id: 'impact-update',
      type: 'impact_update',
      status: 'inactive',
      schedule: 'monthly',
      template: 'Thanks to your support, we\'ve achieved ${impact_metric}. Here\'s how your donation is making a difference.',
    },
  ]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchCommunicationStatus();
  }, []);

  const fetchCommunicationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: workflows, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'donor-communications');

      if (error) throw error;

      // Update communication statuses based on workflows
      setCommunications(prevComms => 
        prevComms.map(comm => {
          const workflow = workflows.find(w => w.config.type === comm.type);
          return {
            ...comm,
            status: workflow?.status || 'inactive',
            lastSent: workflow?.last_run,
            nextSend: workflow?.next_run,
          };
        })
      );
    } catch (error) {
      console.error('Error fetching communication status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (commId: string) => {
    try {
      const comm = communications.find(c => c.id === commId);
      if (!comm) return;

      const newStatus = comm.status === 'active' ? 'inactive' : 'active';
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update in database
      const { data: workflow, error } = await supabase
        .from('automation_workflows')
        .upsert({
          user_id: user.id,
          type: 'donor-communications',
          status: newStatus,
          config: {
            type: comm.type,
            schedule: comm.schedule,
            template: comm.template,
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
      setCommunications(prevComms =>
        prevComms.map(c =>
          c.id === commId ? { ...c, status: newStatus } : c
        )
      );
    } catch (error) {
      console.error('Error toggling communication status:', error);
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
          <h1 className="text-2xl font-semibold text-gray-900">Donor Communications</h1>
          <p className="text-gray-500">Configure automated thank you notes and impact updates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {communications.map((comm) => (
          <div
            key={comm.id}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <EnvelopeIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {comm.type === 'thank_you' ? 'Thank You Notes' : 'Impact Updates'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {comm.type === 'thank_you'
                      ? 'Automated thank you notes for new donations'
                      : 'Regular updates on how donations are making an impact'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggleStatus(comm.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  comm.status === 'active'
                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {comm.status === 'active' ? 'Active' : 'Inactive'}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Schedule</label>
                <select
                  value={comm.schedule}
                  onChange={(e) => {
                    // Update schedule in database and local state
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="immediate">Send immediately</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly digest</option>
                  <option value="monthly">Monthly digest</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Message Template</label>
                <textarea
                  value={comm.template}
                  onChange={(e) => {
                    // Update template in database and local state
                  }}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {comm.lastSent && (
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Last sent: {new Date(comm.lastSent).toLocaleDateString()}</span>
                  </div>
                )}
                {comm.nextSend && (
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Next send: {new Date(comm.nextSend).toLocaleDateString()}</span>
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