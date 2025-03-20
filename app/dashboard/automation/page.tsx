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
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { workflowTemplates, getTemplateById } from '@/app/lib/workflowTemplates';

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
      description: 'Automated thank you notes and updates',
      icon: EnvelopeIcon,
      href: '/dashboard/automation/donor-communications',
      status: 'inactive',
      category: 'communications',
    },
    {
      id: 'grant-reminders',
      name: 'Grant Reminders',
      description: 'Scheduled grant deadline reminders',
      icon: BellIcon,
      href: '/dashboard/automation/grant-reminders',
      status: 'inactive',
      category: 'grants',
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automation Hub</h1>
          <p className="mt-2 text-gray-600">
            Manage your automated workflows and communications
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
          <Button variant="outline">
            <Cog6ToothIcon className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white shadow-sm border-0"
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full bg-white shadow-sm border-0">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="communications">Communications</SelectItem>
              <SelectItem value="grants">Grants</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <DocumentDuplicateIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredFeatures.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredFeatures.filter(f => f.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                filteredFeatures.reduce((sum, f) => sum + (f.stats?.successRate || 0), 0) / filteredFeatures.length
              )}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average success rate across all workflows
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflowTemplates.length}</div>
            <p className="text-xs text-muted-foreground">
              Available workflow templates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Templates */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-8 border-0">
        <h2 className="text-lg font-semibold mb-4">Workflow Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflowTemplates.map((template) => (
            <div key={template.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border-0">
              <h3 className="font-medium mb-2">{template.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {template.description}
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-0 bg-gray-100">{template.category}</Badge>
                <Button variant="outline" size="sm" className="border-0">
                  Use Template
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Workflows */}
      <div className="bg-white shadow-sm rounded-lg p-6 border-0">
        <h2 className="text-lg font-semibold mb-4">Active Workflows</h2>
        <div className="space-y-4">
          {filteredFeatures.map((feature) => (
            <div
              key={feature.id}
              className="flex items-center justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-0"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{feature.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`workflow-${feature.id}`}
                    checked={feature.status === 'active'}
                    onCheckedChange={(checked) => toggleWorkflowStatus(feature.id, checked ? 'active' : 'inactive')}
                  />
                  <Label htmlFor={`workflow-${feature.id}`}>
                    {feature.status === 'active' ? 'Active' : 'Inactive'}
                  </Label>
                </div>
                <Button variant="ghost" size="sm" className="border-0">
                  <Cog6ToothIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 