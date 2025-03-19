'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { workflowTemplates, getTemplateById } from '@/lib/workflowTemplates';

interface WorkflowConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowType: string;
  onSave: (config: any) => void;
}

export function WorkflowConfigModal({
  isOpen,
  onClose,
  workflowType,
  onSave,
}: WorkflowConfigModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('daily');
  const [template, setTemplate] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [notifications, setNotifications] = useState({
    email: true,
    slack: false,
    inApp: true,
  });

  const handleSave = () => {
    onSave({
      name,
      description,
      type: workflowType,
      schedule,
      template,
      isEnabled,
      notifications,
    });
    onClose();
  };

  const selectedTemplate = getTemplateById(template);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Workflow</DialogTitle>
          <DialogDescription>
            Set up your automated workflow settings and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Basic Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter workflow name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter workflow description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Select value={schedule} onValueChange={setSchedule}>
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
              <Label htmlFor="enabled">Enable Workflow</Label>
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {workflowTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Template Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable) => (
                      <Badge key={variable.name} variant="outline">
                        {variable.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Email Notifications</Label>
                <Switch
                  id="email"
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, email: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="slack">Slack Notifications</Label>
                <Switch
                  id="slack"
                  checked={notifications.slack}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, slack: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="inApp">In-App Notifications</Label>
                <Switch
                  id="inApp"
                  checked={notifications.inApp}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, inApp: checked })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Workflow</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 