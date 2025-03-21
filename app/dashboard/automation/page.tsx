'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  EnvelopeIcon,
  BellIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CheckCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loading } from '@/components/ui/loading';

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  trigger: {
    type: 'event' | 'schedule' | 'manual';
    config: Record<string, any>;
  };
  steps: Array<{
    id: string;
    type: 'notification' | 'email' | 'delay' | 'condition';
    config: Record<string, any>;
    next?: string;
  }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
}

export default function AutomationHub() {
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    trigger: {
      type: 'event' | 'schedule' | 'manual';
      config: Record<string, any>;
    };
    steps: Workflow['steps'];
  }>({
    name: '',
    description: '',
    trigger: {
      type: 'event',
      config: {}
    },
    steps: []
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchWorkflows(),
          fetchEmailTemplates()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/automation/workflows');
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to fetch workflows');
    }
  };

  const fetchEmailTemplates = async () => {
    try {
      const response = await fetch('/api/automation/templates');
      const data = await response.json();
      setEmailTemplates(data);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      toast.error('Failed to fetch email templates');
    }
  };

  const handleCreateWorkflow = async () => {
    try {
      const response = await fetch('/api/automation/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow: formData
        }),
      });

      if (!response.ok) throw new Error('Failed to create workflow');

      toast.success('Workflow created successfully');
      setIsCreateOpen(false);
      fetchWorkflows();
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error('Failed to create workflow');
    }
  };

  const handleToggleWorkflow = async (workflowId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/automation/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!response.ok) throw new Error('Failed to update workflow');

      toast.success(`Workflow ${isActive ? 'activated' : 'deactivated'} successfully`);
      fetchWorkflows();
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast.error('Failed to update workflow');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const response = await fetch(`/api/automation/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete workflow');

      toast.success('Workflow deleted successfully');
      fetchWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          id: `step-${prev.steps.length + 1}`,
          type: 'notification',
          config: {}
        }
      ]
    }));
  };

  const updateStep = (index: number, updates: Partial<Workflow['steps'][0]>) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, ...updates } : step
      )
    }));
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesCategory = selectedCategory === 'all' || workflow.trigger.type === selectedCategory;
    const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (workflow.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return <Loading />;
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
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                New Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle>Create New Workflow</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter workflow name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter workflow description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trigger Type</label>
                  <Select
                    value={formData.trigger.type}
                    onValueChange={value => setFormData(prev => ({
                      ...prev,
                      trigger: { ...prev.trigger, type: value as 'event' | 'schedule' | 'manual' }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="schedule">Schedule</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Steps</label>
                  <div className="space-y-4">
                    {formData.steps.map((step, index) => (
                      <Card key={step.id} className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex justify-between items-start mb-4">
                          <Select
                            value={step.type}
                            onValueChange={value => updateStep(index, { type: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="notification">Notification</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="delay">Delay</SelectItem>
                              <SelectItem value="condition">Condition</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(index)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        {step.type === 'notification' && (
                          <div className="space-y-2">
                            <Input
                              placeholder="Notification Title"
                              value={step.config.title || ''}
                              onChange={e => updateStep(index, {
                                config: { ...step.config, title: e.target.value }
                              })}
                            />
                            <Textarea
                              placeholder="Notification Message"
                              value={step.config.message || ''}
                              onChange={e => updateStep(index, {
                                config: { ...step.config, message: e.target.value }
                              })}
                            />
                          </div>
                        )}
                        {step.type === 'email' && (
                          <div className="space-y-2">
                            <Select
                              value={step.config.template || ''}
                              onValueChange={value => updateStep(index, {
                                config: { ...step.config, template: value }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Email Template" />
                              </SelectTrigger>
                              <SelectContent>
                                {emailTemplates.map(template => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Recipient Email"
                              value={step.config.to || ''}
                              onChange={e => updateStep(index, {
                                config: { ...step.config, to: e.target.value }
                              })}
                            />
                          </div>
                        )}
                        {step.type === 'delay' && (
                          <Input
                            type="number"
                            placeholder="Delay in milliseconds"
                            value={step.config.duration || ''}
                            onChange={e => updateStep(index, {
                              config: { ...step.config, duration: parseInt(e.target.value) }
                            })}
                          />
                        )}
                      </Card>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addStep}
                      className="w-full"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Add Step
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateWorkflow}>
                    Create Workflow
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Cog6ToothIcon className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>Automation Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Service</label>
                  <Select defaultValue="sendgrid">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="ses">AWS SES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Notification Settings</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="email-notifications" className="rounded border-gray-300" />
                      <label htmlFor="email-notifications">Email Notifications</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="in-app-notifications" className="rounded border-gray-300" />
                      <label htmlFor="in-app-notifications">In-App Notifications</label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setIsSettingsOpen(false)}>Save Settings</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="schedule">Schedule</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {workflows.length} total workflows
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Templates</CardTitle>
            <EnvelopeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailTemplates.length}</div>
            <p className="text-xs text-muted-foreground">
              Available email templates
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <BellIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((sum, w) => 
                sum + w.steps.filter(s => s.type === 'notification').length, 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Notification steps in workflows
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {filteredWorkflows.map(workflow => (
          <Card key={workflow.id} className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                <p className="text-sm text-gray-500">{workflow.description}</p>
              </div>
              <Badge variant={workflow.is_active ? "default" : "secondary"}>
                {workflow.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">
                Trigger: {workflow.trigger.type}
              </p>
              <p className="text-sm text-gray-600">
                Steps: {workflow.steps.length}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleWorkflow(workflow.id, !workflow.is_active)}
              >
                {workflow.is_active ? (
                  <PauseIcon className="h-4 w-4" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteWorkflow(workflow.id)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 