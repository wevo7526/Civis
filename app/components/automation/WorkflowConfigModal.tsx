import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  onSave: (config: WorkflowConfig & { type: string }) => Promise<void>;
  workflowType: string;
  initialConfig?: Partial<WorkflowConfig>;
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
  onSave,
  workflowType,
  initialConfig,
}: WorkflowConfigModalProps) {
  const { createReminder } = useReminders();
  const [config, setConfig] = useState<WorkflowConfig>({
    name: initialConfig?.name || '',
    description: initialConfig?.description || '',
    schedule: initialConfig?.schedule || 'daily',
    template: initialConfig?.template || '',
    metrics: initialConfig?.metrics || [],
    recipients: initialConfig?.recipients || [],
    notifications: initialConfig?.notifications || {
      type: 'both',
      priority: 'medium',
      reminder_frequency: 'daily',
      reminder_count: 0,
      max_reminders: 3,
    },
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

      await onSave({
        type: workflowType,
        ...config,
      });
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
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Workflow">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Workflow Name</Label>
          <Input
            id="name"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            placeholder="Enter workflow name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            placeholder="Enter workflow description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedule">Schedule</Label>
          <Select
            value={config.schedule}
            onValueChange={(value: string) => setConfig({ ...config, schedule: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select schedule" />
            </SelectTrigger>
            <SelectContent>
              {SCHEDULE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Notifications</Label>
          <div className="space-y-4">
            <Select
              value={config.notifications.type}
              onValueChange={(value: 'email' | 'in-app' | 'both') => 
                setConfig({
                  ...config,
                  notifications: { ...config.notifications, type: value }
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select notification type" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={config.notifications.priority}
              onValueChange={(value: 'low' | 'medium' | 'high') =>
                setConfig({
                  ...config,
                  notifications: { ...config.notifications, priority: value }
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {config.notifications.type !== 'email' && (
              <div className="space-y-2">
                <Label>Reminder Settings</Label>
                <Select
                  value={config.notifications.reminder_frequency}
                  onValueChange={(value: 'once' | 'daily' | 'weekly' | 'monthly') =>
                    setConfig({
                      ...config,
                      notifications: { ...config.notifications, reminder_frequency: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reminder frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={config.notifications.max_reminders}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        notifications: {
                          ...config.notifications,
                          max_reminders: parseInt(e.target.value)
                        }
                      })
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-gray-500">Maximum reminders</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="template">Template</Label>
          <Textarea
            id="template"
            value={config.template}
            onChange={(e) => setConfig({ ...config, template: e.target.value })}
            placeholder="Enter message template"
            rows={4}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Workflow'}
          </Button>
        </div>
      </form>
    </Modal>
  );
} 