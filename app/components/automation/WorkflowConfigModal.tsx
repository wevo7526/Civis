'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { useReminders } from '../Reminders/RemindersProvider';

interface WorkflowConfig {
  name: string;
  description: string;
  schedule: string;
  template: string;
  metrics: string[];
  recipients: string[];
  notifications: {
    type: 'email' | 'in-app' | 'both';
    priority: 'low' | 'medium' | 'high';
    reminder_frequency: 'once' | 'daily' | 'weekly' | 'monthly';
    reminder_count: number;
    max_reminders: number;
  };
}

interface WorkflowConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: any) => void;
  initialConfig?: any;
}

const METRICS_OPTIONS = [
  { value: 'total_donors', label: 'Total Donors' },
  { value: 'total_revenue', label: 'Total Revenue' },
  { value: 'donor_retention', label: 'Donor Retention Rate' },
  { value: 'avg_donation', label: 'Average Donation' },
  { value: 'campaign_performance', label: 'Campaign Performance' },
];

const SCHEDULE_OPTIONS = [
  { value: 'immediate', label: 'Run Immediately' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

const NOTIFICATION_TYPES = [
  { value: 'email', label: 'Email Only' },
  { value: 'in-app', label: 'In-App Only' },
  { value: 'both', label: 'Email & In-App' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function WorkflowConfigModal({
  isOpen,
  onClose,
  onSubmit,
  initialConfig
}: WorkflowConfigModalProps) {
  const { createReminder } = useReminders();
  const [config, setConfig] = useState(initialConfig || {
    name: '',
    description: '',
    schedule: 'immediate',
    type: 'email',
    template: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create a reminder for the workflow
      if (config.notifications.type !== 'email') {
        await createReminder({
          title: config.name,
          description: config.description,
          due_date: new Date().toISOString(), // Will be updated by the workflow engine
          priority: config.notifications.priority,
          status: 'pending',
          category: 'task',
          notification_sent: false,
          reminder_frequency: config.notifications.reminder_frequency,
          reminder_count: config.notifications.reminder_count,
          max_reminders: config.notifications.max_reminders,
        });
      }

      await onSubmit(config);
      onClose();
      toast.success('Workflow saved successfully');
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error('Failed to save workflow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Workflow Configuration</DialogTitle>
          <DialogDescription>
            Configure your automation workflow settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              placeholder="Enter workflow name"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              placeholder="Describe your workflow"
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={config.type}
              onValueChange={(value) => setConfig({ ...config, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
                <SelectItem value="task">Task</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="schedule">Schedule</Label>
            <Select
              value={config.schedule}
              onValueChange={(value) => setConfig({ ...config, schedule: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="template">Template</Label>
            <Textarea
              id="template"
              value={config.template}
              onChange={(e) => setConfig({ ...config, template: e.target.value })}
              placeholder="Enter your template"
              rows={4}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 