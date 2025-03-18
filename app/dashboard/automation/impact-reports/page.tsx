'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  DocumentTextIcon,
  ClockIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface ImpactReport {
  id: string;
  type: 'progress' | 'impact' | 'financial';
  status: 'active' | 'inactive';
  schedule: string;
  template: string;
  metrics: string[];
  lastSent?: string;
  nextSend?: string;
}

export default function ImpactReports() {
  const [reports, setReports] = useState<ImpactReport[]>([
    {
      id: 'progress',
      type: 'progress',
      status: 'inactive',
      schedule: 'monthly',
      template: 'Project Progress Report: Here\'s how we\'re advancing our mission with your support.',
      metrics: ['completion_rate', 'milestones_achieved', 'challenges_faced'],
    },
    {
      id: 'impact',
      type: 'impact',
      status: 'inactive',
      schedule: 'quarterly',
      template: 'Impact Report: See how your support is making a difference in our community.',
      metrics: ['lives_impacted', 'program_outcomes', 'community_feedback'],
    },
    {
      id: 'financial',
      type: 'financial',
      status: 'inactive',
      schedule: 'quarterly',
      template: 'Financial Impact Report: A detailed look at how we\'re using resources to achieve our goals.',
      metrics: ['funds_allocated', 'cost_per_impact', 'efficiency_metrics'],
    },
  ]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchReportStatus();
  }, []);

  const fetchReportStatus = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        return;
      }
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      // Fetch workflows directly without setup attempt
      const { data: workflows, error: workflowsError } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'impact-reports');

      if (workflowsError) {
        console.error('Error fetching workflows:', workflowsError);
        // If table doesn't exist, use default state
        if (workflowsError.code === '42P01') {
          console.log('Table does not exist yet, using default state');
          setLoading(false);
          return;
        }
        return;
      }

      // Update report statuses based on workflows
      setReports(prevReports => 
        prevReports.map(report => {
          const workflow = workflows?.find(w => w.config?.type === report.type);
          return {
            ...report,
            status: workflow?.status || 'inactive',
            lastSent: workflow?.last_run,
            nextSend: workflow?.next_run,
          };
        })
      );
    } catch (error) {
      console.error('Error in fetchReportStatus:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (reportId: string) => {
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      const newStatus = report.status === 'active' ? 'inactive' : 'active';
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update in database
      const { data: workflow, error } = await supabase
        .from('automation_workflows')
        .upsert({
          user_id: user.id,
          type: 'impact-reports',
          status: newStatus,
          config: {
            type: report.type,
            schedule: report.schedule,
            template: report.template,
            metrics: report.metrics,
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
      setReports(prevReports =>
        prevReports.map(r =>
          r.id === reportId ? { ...r, status: newStatus } : r
        )
      );
    } catch (error) {
      console.error('Error toggling report status:', error);
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
          <h1 className="text-2xl font-semibold text-gray-900">Impact Reports</h1>
          <p className="text-gray-500">Configure automated impact and progress reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <DocumentTextIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {report.type === 'progress'
                      ? 'Progress Reports'
                      : report.type === 'impact'
                      ? 'Impact Reports'
                      : 'Financial Reports'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {report.type === 'progress'
                      ? 'Regular updates on project milestones and achievements'
                      : report.type === 'impact'
                      ? 'Comprehensive reports on program outcomes and community impact'
                      : 'Detailed financial performance and resource utilization reports'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggleStatus(report.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  report.status === 'active'
                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {report.status === 'active' ? 'Active' : 'Inactive'}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Schedule</label>
                <select
                  value={report.schedule}
                  onChange={(e) => {
                    // Update schedule in database and local state
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="biannual">Biannual</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Report Template</label>
                <textarea
                  value={report.template}
                  onChange={(e) => {
                    // Update template in database and local state
                  }}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Metrics to Include</label>
                <div className="mt-2 space-y-2">
                  {report.metrics.map((metric) => (
                    <div key={metric} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => {
                          // Toggle metric inclusion
                        }}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        {metric.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {report.lastSent && (
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Last sent: {new Date(report.lastSent).toLocaleDateString()}</span>
                  </div>
                )}
                {report.nextSend && (
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Next send: {new Date(report.nextSend).toLocaleDateString()}</span>
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