import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'pending' | 'completed' | 'failed';
  sent_count: number;
  total_recipients: number;
  failed_count: number;
  created_at: string;
  completed_at: string | null;
}

interface CampaignListProps {
  campaigns: Campaign[];
}

export function CampaignList({ campaigns }: CampaignListProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Email Campaigns</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-lg text-gray-900">{campaign.name}</h3>
                <p className="text-sm text-gray-500">{campaign.subject}</p>
              </div>
              <Badge 
                variant={campaign.status === 'completed' ? 'default' : 'secondary'}
                className={`${
                  campaign.status === 'completed' 
                    ? 'bg-green-100 text-green-700' 
                    : campaign.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                } border-0`}
              >
                {campaign.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Recipients:</span> {campaign.sent_count}/{campaign.total_recipients}
              </p>
              {campaign.failed_count > 0 && (
                <p className="text-sm text-red-600">
                  <span className="font-medium">Failed:</span> {campaign.failed_count}
                </p>
              )}
              <p className="text-sm text-gray-600">
                <span className="font-medium">Created:</span> {new Date(campaign.created_at).toLocaleDateString()}
              </p>
              {campaign.completed_at && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Completed:</span> {new Date(campaign.completed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 