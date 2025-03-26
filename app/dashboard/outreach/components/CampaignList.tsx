import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon, EnvelopeIcon, ClockIcon, UserGroupIcon } from "@heroicons/react/24/outline";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  from_name: string;
  from_email: string;
  reply_to: string;
  status: 'pending' | 'completed' | 'failed';
  scheduled_for: string | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  completed_at: string | null;
  organization_name?: string;
  organization_address?: string;
  organization_phone?: string;
  organization_website?: string;
  is_default?: boolean;
  recipient_ids?: string[];
  user_id: string;
}

interface CampaignListProps {
  campaigns: Campaign[];
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (campaignId: string) => void;
}

export function CampaignList({ campaigns, onEdit, onDelete }: CampaignListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Email Campaigns</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{campaign.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{campaign.subject}</p>
              </div>
              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(campaign)}
                    className="text-gray-500 hover:text-purple-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(campaign.id)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Badge 
                variant={
                  campaign.status === 'completed' 
                    ? 'default' 
                    : campaign.status === 'failed' 
                    ? 'destructive' 
                    : 'secondary'
                }
                className="font-medium"
              >
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </Badge>
              {campaign.scheduled_for && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  {new Date(campaign.scheduled_for).toLocaleString()}
                </Badge>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <EnvelopeIcon className="h-4 w-4" />
                <span>From: {campaign.from_name} &lt;{campaign.from_email}&gt;</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <UserGroupIcon className="h-4 w-4" />
                <span>Recipients: {campaign.total_recipients}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <div>
                  <span className="font-medium text-green-600">{campaign.sent_count}</span> sent
                </div>
                <div>
                  <span className="font-medium text-red-600">{campaign.failed_count}</span> failed
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Created: {new Date(campaign.created_at).toLocaleDateString()}
                  {campaign.completed_at && (
                    <div>Completed: {new Date(campaign.completed_at).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 