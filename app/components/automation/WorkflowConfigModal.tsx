import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface WorkflowConfig {
  name: string;
  type: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  template: string;
  recipients?: string[];
  metrics?: string[];
  customSchedule?: {
    frequency: number;
    unit: 'days' | 'weeks' | 'months';
  };
}

interface WorkflowConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowType: string;
  onSave: (config: WorkflowConfig) => Promise<void>;
}

export function WorkflowConfigModal({ isOpen, onClose, workflowType, onSave }: WorkflowConfigModalProps) {
  const [config, setConfig] = useState<WorkflowConfig>({
    name: '',
    type: workflowType,
    schedule: 'daily',
    template: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(config);
      onClose();
    } catch (error) {
      console.error('Error saving workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderConfigFields = () => {
    switch (workflowType) {
      case 'donor-communications':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="template">Thank You Template</Label>
              <Textarea
                id="template"
                value={config.template}
                onChange={(e) => setConfig({ ...config, template: e.target.value })}
                placeholder="Thank you for your generous donation of ${amount}. Your support helps us make a difference."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Select
                value={config.schedule}
                onValueChange={(value) => setConfig({ ...config, schedule: value as WorkflowConfig['schedule'] })}
              >
                <option value="immediate">Immediate</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </div>
          </>
        );

      case 'grant-reminders':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="template">Reminder Template</Label>
              <Textarea
                id="template"
                value={config.template}
                onChange={(e) => setConfig({ ...config, template: e.target.value })}
                placeholder="Reminder: The grant application for ${grant_name} is due on ${deadline}."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule">Reminder Frequency</Label>
              <Select
                value={config.schedule}
                onValueChange={(value) => setConfig({ ...config, schedule: value as WorkflowConfig['schedule'] })}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </div>
          </>
        );

      case 'impact-reports':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="template">Report Template</Label>
              <Textarea
                id="template"
                value={config.template}
                onChange={(e) => setConfig({ ...config, template: e.target.value })}
                placeholder="Impact Report: Here's how we're using your support to achieve our goals."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule">Report Frequency</Label>
              <Select
                value={config.schedule}
                onValueChange={(value) => setConfig({ ...config, schedule: value as WorkflowConfig['schedule'] })}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Metrics to Include</Label>
              <div className="space-y-2">
                {['completion_rate', 'milestones_achieved', 'lives_impacted', 'funds_allocated'].map((metric) => (
                  <label key={metric} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.metrics?.includes(metric)}
                      onChange={(e) => {
                        const metrics = config.metrics || [];
                        setConfig({
                          ...config,
                          metrics: e.target.checked
                            ? [...metrics, metric]
                            : metrics.filter((m) => m !== metric),
                        });
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">{metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        );

      case 'performance-analytics':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="schedule">Update Frequency</Label>
              <Select
                value={config.schedule}
                onValueChange={(value) => setConfig({ ...config, schedule: value as WorkflowConfig['schedule'] })}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Metrics to Track</Label>
              <div className="space-y-2">
                {['donor_retention', 'grant_success_rate', 'program_efficiency', 'cost_per_impact'].map((metric) => (
                  <label key={metric} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.metrics?.includes(metric)}
                      onChange={(e) => {
                        const metrics = config.metrics || [];
                        setConfig({
                          ...config,
                          metrics: e.target.checked
                            ? [...metrics, metric]
                            : metrics.filter((m) => m !== metric),
                        });
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">{metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Configure ${workflowType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Workflow Name</Label>
          <Input
            id="name"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            placeholder="Enter a name for this workflow"
          />
        </div>

        {renderConfigFields()}

        <div className="mt-6 flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Workflow'}
          </Button>
        </div>
      </form>
    </Modal>
  );
} 