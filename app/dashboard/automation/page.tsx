'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  EnvelopeIcon,
  BellIcon,
  DocumentTextIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { WorkflowConfigModal } from '@/components/automation/WorkflowConfigModal';

interface AutomationFeature {
  id: string;
  name: string;
  description: string;
  icon: any;
  href: string;
  status: 'active' | 'inactive' | 'pending' | 'error';
  lastRun?: string;
  nextRun?: string;
  stats?: {
    totalRuns: number;
    successRate: number;
    lastError?: string;
  };
  category: 'communications' | 'reports' | 'grants' | 'analytics';
}

export default function AutomationHub() {
  const [features, setFeatures] = useState<AutomationFeature[]>([
    {
      id: 'donor-communications',
      name: 'Donor Communications',
      description: 'Automated thank you notes and impact updates',
      icon: EnvelopeIcon,
      href: '/dashboard/automation/donor-communications',
      status: 'inactive',
      category: 'communications',
    },
    {
      id: 'grant-reminders',
      name: 'Grant Reminders',
      description: 'Automated grant deadline notifications and tracking',
      icon: BellIcon,
      href: '/dashboard/automation/grant-reminders',
      status: 'inactive',
      category: 'grants',
    },
    {
      id: 'impact-reports',
      name: 'Impact Reports',
      description: 'Scheduled progress and impact updates',
      icon: DocumentTextIcon,
      href: '/dashboard/automation/impact-reports',
      status: 'inactive',
      category: 'reports',
    },
    {
      id: 'grant-writing',
      name: 'Grant Writing Assistant',
      description: 'AI-powered grant proposal generation',
      icon: DocumentDuplicateIcon,
      href: '/dashboard/automation/grant-writing',
      status: 'inactive',
      category: 'grants',
    },
    {
      id: 'performance-analytics',
      name: 'Performance Analytics',
      description: 'Automated tracking of key metrics and KPIs',
      icon: ChartBarIcon,
      href: '/dashboard/automation/analytics',
      status: 'inactive',
      category: 'analytics',
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchAutomationStatus();
  }, []);

  const fetchAutomationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: workflows, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching workflows:', error);
        return;
      }

      // Update feature statuses based on workflows
      setFeatures(prevFeatures => 
        prevFeatures.map(feature => {
          const workflow = workflows.find(w => w.type === feature.id);
          return {
            ...feature,
            status: workflow?.status || 'inactive',
            lastRun: workflow?.last_run,
            nextRun: workflow?.next_run,
            stats: workflow?.stats || {
              totalRuns: 0,
              successRate: 0,
            },
          };
        })
      );
    } catch (error) {
      console.error('Error fetching automation status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflowStatus = async (featureId: string, currentStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      // Update or insert workflow
      const { data: workflow, error } = await supabase
        .from('automation_workflows')
        .upsert({
          user_id: user.id,
          type: featureId,
          status: newStatus,
          config: {
            type: featureId,
            schedule: 'daily', // Default schedule
            template: getDefaultTemplate(featureId),
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
      setFeatures(prevFeatures =>
        prevFeatures.map(feature =>
          feature.id === featureId
            ? { ...feature, status: newStatus }
            : feature
        )
      );
    } catch (error) {
      console.error('Error toggling workflow status:', error);
    }
  };

  const getDefaultTemplate = (featureId: string): string => {
    switch (featureId) {
      case 'donor-communications':
        return 'Thank you for your generous donation of ${amount}. Your support helps us make a difference.';
      case 'grant-reminders':
        return 'Reminder: The grant application for ${grant_name} is due on ${deadline}.';
      case 'impact-reports':
        return 'Impact Report: Here\'s how we\'re using your support to achieve our goals.';
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredFeatures = features.filter(feature => {
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
    const matchesSearch = feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveWorkflow = async (config: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: workflow, error } = await supabase
        .from('automation_workflows')
        .upsert({
          user_id: user.id,
          type: config.type,
          name: config.name,
          status: 'active',
          config: {
            schedule: config.schedule,
            template: config.template,
            metrics: config.metrics,
          },
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setFeatures(prevFeatures =>
        prevFeatures.map(feature =>
          feature.id === config.type
            ? {
                ...feature,
                status: 'active',
                stats: {
                  totalRuns: 0,
                  successRate: 100,
                },
              }
            : feature
        )
      );

      // Start the workflow
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
    } catch (error) {
      console.error('Error saving workflow:', error);
      throw error;
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
          <h1 className="text-2xl font-semibold text-gray-900">Automation Hub</h1>
          <p className="text-gray-500">Manage your automated workflows and communications</p>
        </div>
        <button
          onClick={() => setSelectedWorkflow('new')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Create Workflow
        </button>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="communications">Communications</option>
            <option value="reports">Reports</option>
            <option value="grants">Grants</option>
            <option value="analytics">Analytics</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((feature) => (
            <div
              key={feature.id}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{feature.name}</h3>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                  {feature.status.charAt(0).toUpperCase() + feature.status.slice(1)}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {feature.lastRun && (
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span>Last run: {new Date(feature.lastRun).toLocaleDateString()}</span>
                  </div>
                )}
                {feature.nextRun && (
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span>Next run: {new Date(feature.nextRun).toLocaleDateString()}</span>
                  </div>
                )}
                {feature.stats && (
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <ArrowPathIcon className="h-4 w-4 mr-1" />
                      <span>{feature.stats.totalRuns} runs</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                      <span>{feature.stats.successRate}% success</span>
                    </div>
                  </div>
                )}
                {feature.status === 'error' && feature.stats?.lastError && (
                  <div className="flex items-center text-sm text-red-500">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                    <span>{feature.stats.lastError}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setSelectedWorkflow(feature.id)}
                  className="flex-1 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Configure
                </button>
                <button
                  onClick={() => toggleWorkflowStatus(feature.id, feature.status)}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    feature.status === 'active'
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {feature.status === 'active' ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedWorkflow && (
        <WorkflowConfigModal
          isOpen={!!selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
          workflowType={selectedWorkflow === 'new' ? 'donor-communications' : selectedWorkflow}
          onSave={handleSaveWorkflow}
        />
      )}
    </div>
  );
} 