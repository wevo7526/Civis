import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';

interface WorkflowConfig {
  name: string;
  description: string;
  schedule: string;
  template: string;
  metrics: string[];
  recipients: string[];
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

export function WorkflowConfigModal({
  isOpen,
  onClose,
  onSave,
  workflowType,
  initialConfig,
}: WorkflowConfigModalProps) {
  const [config, setConfig] = useState<WorkflowConfig>({
    name: initialConfig?.name || '',
    description: initialConfig?.description || '',
    schedule: initialConfig?.schedule || 'daily',
    template: initialConfig?.template || '',
    metrics: initialConfig?.metrics || [],
    recipients: initialConfig?.recipients || [],
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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
          <Label>Metrics to Include</Label>
          <div className="space-y-2">
            {METRICS_OPTIONS.map((metric) => (
              <div key={metric.value} className="flex items-center space-x-2">
                <Checkbox
                  id={metric.value}
                  checked={config.metrics.includes(metric.value)}
                  onCheckedChange={(checked: boolean) => {
                    setConfig({
                      ...config,
                      metrics: checked
                        ? [...config.metrics, metric.value]
                        : config.metrics.filter((m: string) => m !== metric.value),
                    });
                  }}
                />
                <Label htmlFor={metric.value}>{metric.label}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="template">Message Template</Label>
          <Textarea
            id="template"
            value={config.template}
            onChange={(e) => setConfig({ ...config, template: e.target.value })}
            placeholder="Enter message template"
            className="h-32"
            required
          />
          <p className="text-sm text-gray-500">
            Use {'${metric_name}'} to include metrics in your template
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onClose}>
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