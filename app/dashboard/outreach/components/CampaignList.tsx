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
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaignId: string) => Promise<void>;
  onCreateABTest: (campaign: Campaign) => Promise<void>;
  onCreateFollowUp: (campaign: Campaign) => Promise<void>;
}

export function CampaignList({ campaigns, onEdit, onDelete, onCreateABTest, onCreateFollowUp }: CampaignListProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="p-6 hover:shadow-md transition-all duration-200 border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{campaign.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{campaign.subject}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCreateABTest(campaign)}
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  A/B Test
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCreateFollowUp(campaign)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Follow-up
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(campaign)}
                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(campaign.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete
                </Button>
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
                className="font-medium px-2 py-1"
              >
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </Badge>
              {campaign.scheduled_for && (
                <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
                  <ClockIcon className="h-3 w-3" />
                  {new Date(campaign.scheduled_for).toLocaleString()}
                </Badge>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <EnvelopeIcon className="h-4 w-4 text-purple-500" />
                <span>From: {campaign.from_name} &lt;{campaign.from_email}&gt;</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <UserGroupIcon className="h-4 w-4 text-blue-500" />
                <span>Recipients: {campaign.total_recipients}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-green-600">{campaign.sent_count}</span>
                  <span>sent</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-red-600">{campaign.failed_count}</span>
                  <span>failed</span>
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