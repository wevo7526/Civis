import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { RecipientSelector } from './RecipientSelector';

interface Recipient {
  id: string;
  name: string;
  email: string;
  type: 'donor' | 'volunteer' | 'participant';
}

export interface CampaignFormData {
  name: string;
  subject: string;
  content: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  scheduleTime: Date | null;
  organizationName: string;
  organizationAddress: string;
  organizationPhone: string;
  organizationWebsite: string;
  isDefault: boolean;
  recipients: Recipient[];
  type: 'donor' | 'volunteer' | 'both';
}

interface CampaignFormProps {
  recipients: Recipient[];
  onSubmit: (data: CampaignFormData) => Promise<void>;
  onCancel: () => void;
  campaign?: {
    id: string;
    name: string;
    subject: string;
    content: string;
    fromName: string;
    fromEmail: string;
    replyTo: string;
    scheduleTime: Date | null;
    organizationName: string;
    organizationAddress: string;
    organizationPhone: string;
    organizationWebsite: string;
    isDefault: boolean;
    recipients: Recipient[];
    type: 'donor' | 'volunteer' | 'both';
  };
  template?: {
    id: string;
    name: string;
    description: string;
    type: 'donor' | 'volunteer' | 'both';
    subject: string;
    content: string;
    status: 'draft' | 'active' | 'paused';
  };
}

export function CampaignForm({ recipients, onSubmit, onCancel, campaign, template }: CampaignFormProps) {
  const [formData, setFormData] = useState<CampaignFormData>({
    name: campaign?.name || '',
    subject: campaign?.subject || '',
    content: campaign?.content || '',
    fromName: campaign?.fromName || '',
    fromEmail: campaign?.fromEmail || '',
    replyTo: campaign?.replyTo || '',
    scheduleTime: campaign?.scheduleTime || null,
    organizationName: campaign?.organizationName || '',
    organizationAddress: campaign?.organizationAddress || '',
    organizationPhone: campaign?.organizationPhone || '',
    organizationWebsite: campaign?.organizationWebsite || '',
    isDefault: campaign?.isDefault || false,
    recipients: campaign?.recipients || [],
    type: campaign?.type || 'both'
  });

  useEffect(() => {
    if (campaign) {
      setFormData(campaign);
    }
  }, [campaign]);

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.subject.trim() !== '' &&
      formData.content.trim() !== '' &&
      formData.fromName.trim() !== '' &&
      formData.fromEmail.trim() !== '' &&
      formData.recipients.length > 0 &&
      (!formData.scheduleTime || formData.scheduleTime > new Date())
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="campaign-name" className="text-sm font-medium text-gray-700">
            Campaign Name
          </Label>
          <Input
            id="campaign-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            placeholder="Enter campaign name"
            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaign-subject" className="text-sm font-medium text-gray-700">
            Email Subject
          </Label>
          <Input
            id="campaign-subject"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            required
            placeholder="Enter email subject"
            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Email Content</Label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          required
          placeholder="Write your email content here..."
          className="min-h-[200px] border-gray-200 focus:border-purple-500 focus:ring-purple-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="from-name" className="text-sm font-medium text-gray-700">
            From Name
          </Label>
          <Input
            id="from-name"
            value={formData.fromName}
            onChange={(e) => setFormData(prev => ({ ...prev, fromName: e.target.value }))}
            required
            placeholder="Enter sender name"
            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="from-email" className="text-sm font-medium text-gray-700">
            From Email
          </Label>
          <Input
            id="from-email"
            type="email"
            value={formData.fromEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, fromEmail: e.target.value }))}
            required
            placeholder="Enter sender email"
            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reply-to" className="text-sm font-medium text-gray-700">
          Reply-To Email
        </Label>
        <Input
          id="reply-to"
          type="email"
          value={formData.replyTo}
          onChange={(e) => setFormData(prev => ({ ...prev, replyTo: e.target.value }))}
          placeholder="Enter reply-to email"
          className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
        />
      </div>

      <RecipientSelector
        recipients={recipients}
        selectedRecipients={formData.recipients}
        onSelectionChange={(recipients) => setFormData(prev => ({ ...prev, recipients }))}
      />

      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h3 className="text-lg font-medium text-gray-900">Organization Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="organization-name" className="text-sm font-medium text-gray-700">
              Organization Name
            </Label>
            <Input
              id="organization-name"
              value={formData.organizationName}
              onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
              placeholder="Enter organization name"
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization-address" className="text-sm font-medium text-gray-700">
              Organization Address
            </Label>
            <Input
              id="organization-address"
              value={formData.organizationAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, organizationAddress: e.target.value }))}
              placeholder="Enter organization address"
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization-phone" className="text-sm font-medium text-gray-700">
              Organization Phone
            </Label>
            <Input
              id="organization-phone"
              value={formData.organizationPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, organizationPhone: e.target.value }))}
              placeholder="Enter organization phone"
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization-website" className="text-sm font-medium text-gray-700">
              Organization Website
            </Label>
            <Input
              id="organization-website"
              value={formData.organizationWebsite}
              onChange={(e) => setFormData(prev => ({ ...prev, organizationWebsite: e.target.value }))}
              placeholder="Enter organization website"
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is-default"
            checked={formData.isDefault}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
          />
          <Label htmlFor="is-default" className="text-sm font-medium text-gray-700">
            Set as Default Organization
          </Label>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-gray-100">
        <Label className="text-sm font-medium text-gray-700">Schedule Campaign</Label>
        <div className="grid grid-cols-2 gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal border-gray-200",
                  !formData.scheduleTime && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.scheduleTime ? format(formData.scheduleTime, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.scheduleTime || undefined}
                onSelect={(date) => setFormData(prev => ({ ...prev, scheduleTime: date || null }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <input
            type="time"
            value={formData.scheduleTime ? format(formData.scheduleTime, "HH:mm") : ""}
            onChange={(e) => {
              const [hours, minutes] = e.target.value.split(":");
              const newDate = formData.scheduleTime || new Date();
              newDate.setHours(parseInt(hours), parseInt(minutes));
              setFormData(prev => ({ ...prev, scheduleTime: newDate }));
            }}
            className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-gray-200 hover:bg-gray-50"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isFormValid()}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {campaign ? 'Update Campaign' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  );
} 