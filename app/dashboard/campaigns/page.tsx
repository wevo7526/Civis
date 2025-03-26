'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  MegaphoneIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Dynamically import GanttChart with no SSR
const GanttChart = dynamic(() => import('@/app/components/GanttChart'), {
  ssr: false,
});

interface Campaign {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  budget: number;
  impact_target: string;
  impact_metric: string;
  created_at: string;
  updated_at: string;
}

interface CampaignItem {
  id: string;
  campaign_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string;
  dependencies: string[];
  created_at: string;
  updated_at: string;
}

interface CampaignFormData {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: Campaign['status'];
  budget: number;
  impact_target: string;
  impact_metric: string;
}

interface CampaignItemFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: CampaignItem['status'];
  priority: CampaignItem['priority'];
  assigned_to: string;
  dependencies: string[];
}

const initialCampaignFormData: CampaignFormData = {
  name: '',
  description: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: 'planning',
  budget: 0,
  impact_target: '',
  impact_metric: '',
};

const initialCampaignItemFormData: CampaignItemFormData = {
  title: '',
  description: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: 'not-started',
  priority: 'medium',
  assigned_to: '',
  dependencies: [],
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
  const [campaignItemToEdit, setCampaignItemToEdit] = useState<CampaignItem | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>(initialCampaignFormData);
  const [itemFormData, setItemFormData] = useState<CampaignItemFormData>(initialCampaignItemFormData);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (campaignToEdit) {
      setFormData({
        name: campaignToEdit.name,
        description: campaignToEdit.description,
        start_date: campaignToEdit.start_date,
        end_date: campaignToEdit.end_date,
        status: campaignToEdit.status,
        budget: campaignToEdit.budget,
        impact_target: campaignToEdit.impact_target,
        impact_metric: campaignToEdit.impact_metric,
      });
      setIsModalOpen(true);
    }
  }, [campaignToEdit]);

  useEffect(() => {
    if (campaignItemToEdit) {
      setItemFormData({
        title: campaignItemToEdit.title,
        description: campaignItemToEdit.description,
        start_date: campaignItemToEdit.start_date,
        end_date: campaignItemToEdit.end_date,
        status: campaignItemToEdit.status,
        priority: campaignItemToEdit.priority,
        assigned_to: campaignItemToEdit.assigned_to,
        dependencies: campaignItemToEdit.dependencies,
      });
      setIsItemModalOpen(true);
    }
  }, [campaignItemToEdit]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (campaignToEdit) {
        const { error } = await supabase
          .from('campaigns')
          .update(formData)
          .eq('id', campaignToEdit.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('campaigns')
          .insert({
            ...formData,
            user_id: user.id,
          });

        if (error) throw error;
      }

      await fetchCampaigns();
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting campaign:', error);
      setError(error instanceof Error ? error.message : 'Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    try {
      setLoading(true);
      setError(null);

      if (campaignItemToEdit) {
        const { error } = await supabase
          .from('campaign_items')
          .update(itemFormData)
          .eq('id', campaignItemToEdit.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('campaign_items')
          .insert({
            ...itemFormData,
            campaign_id: selectedCampaign.id,
          });

        if (error) throw error;
      }

      await fetchCampaigns();
      handleCloseItemModal();
    } catch (error) {
      console.error('Error submitting campaign item:', error);
      setError(error instanceof Error ? error.message : 'Failed to save campaign item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignToDelete.id);

      if (error) throw error;

      await fetchCampaigns();
      setIsDeleteModalOpen(false);
      setCampaignToDelete(null);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCampaignToEdit(null);
    setFormData(initialCampaignFormData);
  };

  const handleCloseItemModal = () => {
    setIsItemModalOpen(false);
    setCampaignItemToEdit(null);
    setItemFormData(initialCampaignItemFormData);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <Button
          onClick={() => {
            setCampaignToEdit(null);
            setFormData(initialCampaignFormData);
            setIsModalOpen(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Campaign
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-lg text-gray-900">{campaign.name}</h3>
                <p className="text-sm text-gray-500">{campaign.description}</p>
              </div>
              <Badge 
                variant={campaign.status === 'active' ? 'default' : 'secondary'}
                className={`${
                  campaign.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : campaign.status === 'planning'
                    ? 'bg-yellow-100 text-yellow-700'
                    : campaign.status === 'completed'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                } border-0`}
              >
                {campaign.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Budget:</span> ${campaign.budget.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Impact Target:</span> {campaign.impact_target}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Impact Metric:</span> {campaign.impact_metric}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Duration:</span> {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Campaign Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-lg rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-900">
              {campaignToEdit ? 'Edit Campaign' : 'Create New Campaign'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {campaignToEdit 
                ? 'Update your campaign details below.'
                : 'Fill in the details to create a new campaign.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
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
              <Label htmlFor="campaign-description" className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <Textarea
                id="campaign-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                placeholder="Enter campaign description"
                className="min-h-[100px] border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm font-medium text-gray-700">
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                  className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm font-medium text-gray-700">
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  required
                  className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-sm font-medium text-gray-700">
                  Budget
                </Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: Number(e.target.value) }))}
                  required
                  min="0"
                  step="0.01"
                  className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Campaign['status'] }))}
                >
                  <SelectTrigger className="w-full border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="impact-target" className="text-sm font-medium text-gray-700">
                  Impact Target
                </Label>
                <Input
                  id="impact-target"
                  value={formData.impact_target}
                  onChange={(e) => setFormData(prev => ({ ...prev, impact_target: e.target.value }))}
                  required
                  placeholder="Enter impact target"
                  className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="impact-metric" className="text-sm font-medium text-gray-700">
                  Impact Metric
                </Label>
                <Input
                  id="impact-metric"
                  value={formData.impact_metric}
                  onChange={(e) => setFormData(prev => ({ ...prev, impact_metric: e.target.value }))}
                  required
                  placeholder="Enter impact metric"
                  className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                className="border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={loading}
              >
                {campaignToEdit ? 'Update Campaign' : 'Create Campaign'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 