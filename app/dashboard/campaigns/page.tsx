'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Dialog } from '@headlessui/react';
import gantt from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

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
  const [campaignItems, setCampaignItems] = useState<CampaignItem[]>([]);
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
  const ganttContainer = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchCampaigns();
    fetchCampaignItems();
  }, []);

  useEffect(() => {
    if (ganttContainer.current) {
      initializeGantt();
    }
  }, [campaignItems]);

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

  const initializeGantt = () => {
    gantt.config.date_format = '%Y-%m-%d';
    gantt.config.columns = [
      { name: 'text', label: 'Task', tree: true, width: 200 },
      { name: 'start_date', label: 'Start', align: 'center', width: 100 },
      { name: 'end_date', label: 'End', align: 'center', width: 100 },
      { name: 'status', label: 'Status', align: 'center', width: 100 },
      { name: 'priority', label: 'Priority', align: 'center', width: 100 },
    ];

    const tasks = campaignItems.map(item => ({
      id: item.id,
      text: item.title,
      start_date: new Date(item.start_date),
      end_date: new Date(item.end_date),
      status: item.status,
      priority: item.priority,
      progress: item.status === 'completed' ? 1 : item.status === 'in-progress' ? 0.5 : 0,
      dependencies: item.dependencies.join(','),
    }));

    gantt.clearAll();
    gantt.parse({ data: tasks });
    gantt.render();
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('campaign_items')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setCampaignItems(data || []);
    } catch (error) {
      console.error('Error fetching campaign items:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch campaign items');
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

      await fetchCampaignItems();
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
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Campaign
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact Target</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    campaign.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    ${campaign.budget.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {campaign.impact_target} {campaign.impact_metric}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setIsItemModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <ChartBarIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setCampaignToDelete(campaign);
                      setIsDeleteModalOpen(true);
                    }}
                    className="text-red-600 hover:text-red-900 mr-4"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setCampaignToEdit(campaign);
                    }}
                    className="text-purple-600 hover:text-purple-900"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Campaign Gantt Chart */}
      {selectedCampaign && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              {selectedCampaign.name} - Timeline
            </h2>
            <button
              onClick={() => setIsItemModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Task
            </button>
          </div>
          <div ref={ganttContainer} className="h-[400px]"></div>
        </div>
      )}

      {/* Add/Edit Campaign Modal */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {campaignToEdit ? 'Edit Campaign' : 'Add New Campaign'}
              </Dialog.Title>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    required
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Campaign['status'] }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                    Budget
                  </label>
                  <input
                    type="number"
                    id="budget"
                    required
                    min="0"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="impact_target" className="block text-sm font-medium text-gray-700">
                    Impact Target
                  </label>
                  <input
                    type="text"
                    id="impact_target"
                    required
                    value={formData.impact_target}
                    onChange={(e) => setFormData(prev => ({ ...prev, impact_target: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="impact_metric" className="block text-sm font-medium text-gray-700">
                    Impact Metric
                  </label>
                  <input
                    type="text"
                    id="impact_metric"
                    required
                    value={formData.impact_metric}
                    onChange={(e) => setFormData(prev => ({ ...prev, impact_metric: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {loading ? (campaignToEdit ? 'Updating...' : 'Adding...') : (campaignToEdit ? 'Update Campaign' : 'Add Campaign')}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Add/Edit Campaign Item Modal */}
      <Dialog
        open={isItemModalOpen}
        onClose={handleCloseItemModal}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {campaignItemToEdit ? 'Edit Task' : 'Add New Task'}
              </Dialog.Title>
            </div>
            
            <form onSubmit={handleItemSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={itemFormData.title}
                    onChange={(e) => setItemFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    required
                    value={itemFormData.status}
                    onChange={(e) => setItemFormData(prev => ({ ...prev, status: e.target.value as CampaignItem['status'] }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  >
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <select
                    id="priority"
                    required
                    value={itemFormData.priority}
                    onChange={(e) => setItemFormData(prev => ({ ...prev, priority: e.target.value as CampaignItem['priority'] }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    id="assigned_to"
                    value={itemFormData.assigned_to}
                    onChange={(e) => setItemFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    required
                    value={itemFormData.start_date}
                    onChange={(e) => setItemFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    required
                    value={itemFormData.end_date}
                    onChange={(e) => setItemFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={itemFormData.description}
                    onChange={(e) => setItemFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="dependencies" className="block text-sm font-medium text-gray-700">
                    Dependencies (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="dependencies"
                    value={itemFormData.dependencies.join(', ')}
                    onChange={(e) => setItemFormData(prev => ({ ...prev, dependencies: e.target.value.split(',').map(d => d.trim()) }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseItemModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {loading ? (campaignItemToEdit ? 'Updating...' : 'Adding...') : (campaignItemToEdit ? 'Update Task' : 'Add Task')}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm w-full bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Delete Campaign
              </Dialog.Title>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete {campaignToDelete?.name}? This action cannot be undone.
              </p>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCampaign}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 