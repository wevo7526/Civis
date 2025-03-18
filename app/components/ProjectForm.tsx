'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/lib/projectService';
import { Grant, FundraisingCampaign } from '@/lib/types';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  onCancel: () => void;
}

interface AISuggestions {
  impact_statement: string;
  budget_recommendation: string;
  timeline_suggestion: string;
}

interface FormData {
  name: string;
  description: string;
  status: Project['status'];
  start_date: string;
  end_date: string;
  budget: string;
  impact_target: string;
  impact_metric: string;
  team_size: string;
  team_roles: string;
  grant_status: Grant['status'];
  grant_amount: string;
  grant_deadline: string;
  campaign_type: FundraisingCampaign['type'];
  campaign_goal: string;
  campaign_deadline: string;
}

export default function ProjectForm({ project, onSubmit, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'active',
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
    budget: project?.budget?.toString() || '',
    impact_target: project?.impact_target || '',
    impact_metric: project?.impact_metric || '',
    team_size: project?.team_size?.toString() || '',
    team_roles: project?.team_roles?.join(', ') || '',
    grant_status: project?.grant?.status || 'draft',
    grant_amount: project?.grant?.amount?.toString() || '',
    grant_deadline: project?.grant?.deadline || '',
    campaign_type: project?.campaign?.type || 'program',
    campaign_goal: project?.campaign?.goal?.toString() || '',
    campaign_deadline: project?.campaign?.end_date || '',
  });

  const [suggestions, setSuggestions] = useState<AISuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const generateSuggestions = async () => {
      if (formData.name && formData.description) {
        try {
          const response = await fetch('/api/ai/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_name: formData.name,
              project_description: formData.description,
            }),
          });

          if (!response.ok) throw new Error('Failed to generate suggestions');
          
          const data = await response.json();
          setSuggestions(data);
        } catch (err) {
          console.error('Error generating suggestions:', err);
        }
      }
    };

    const debounce = setTimeout(generateSuggestions, 1000);
    return () => clearTimeout(debounce);
  }, [formData.name, formData.description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert project status to campaign status
      const campaignStatus: FundraisingCampaign['status'] = formData.status === 'planning' ? 'planned' :
                                                          formData.status === 'on-hold' ? 'cancelled' :
                                                          formData.status === 'active' ? 'active' :
                                                          'completed';

      const projectData = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        start_date: formData.start_date,
        end_date: formData.end_date,
        budget: Number(formData.budget),
        impact_target: formData.impact_target,
        impact_metric: formData.impact_metric,
        team_size: Number(formData.team_size),
        team_roles: formData.team_roles.split(',').map(role => role.trim()),
        impact_current: 0,
        grant: {
          title: formData.name,
          organization: '',
          amount: Number(formData.grant_amount),
          deadline: formData.grant_deadline,
          status: formData.grant_status,
          description: formData.description,
          impact_statement: '',
          budget: Number(formData.budget),
        },
        campaign: {
          name: formData.name,
          description: formData.description,
          goal: Number(formData.campaign_goal),
          current_amount: 0,
          start_date: formData.start_date,
          end_date: formData.campaign_deadline,
          status: campaignStatus,
          type: formData.campaign_type,
        }
      };

      await onSubmit(projectData);
    } catch (err) {
      setError('Failed to create project');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Project Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {suggestions && (
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="h-5 w-5 text-blue-500" />
              <h3 className="text-sm font-medium text-blue-800">AI Suggestions</h3>
            </div>
            <div className="space-y-2">
              <div>
                <h4 className="text-sm font-medium text-blue-700">Impact Statement</h4>
                <p className="text-sm text-blue-600">{suggestions.impact_statement}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-700">Budget Recommendation</h4>
                <p className="text-sm text-blue-600">{suggestions.budget_recommendation}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-700">Timeline Suggestion</h4>
                <p className="text-sm text-blue-600">{suggestions.timeline_suggestion}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="planned">Planned</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
              Budget
            </label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="impact_target" className="block text-sm font-medium text-gray-700">
            Impact Target
          </label>
          <input
            type="text"
            id="impact_target"
            name="impact_target"
            value={formData.impact_target}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="impact_metric" className="block text-sm font-medium text-gray-700">
            Impact Metric
          </label>
          <input
            type="text"
            id="impact_metric"
            name="impact_metric"
            value={formData.impact_metric}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="team_size" className="block text-sm font-medium text-gray-700">
              Team Size
            </label>
            <input
              type="number"
              id="team_size"
              name="team_size"
              value={formData.team_size}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="team_roles" className="block text-sm font-medium text-gray-700">
              Team Roles
            </label>
            <input
              type="text"
              id="team_roles"
              name="team_roles"
              value={formData.team_roles}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Grant Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="grant_status" className="block text-sm font-medium text-gray-700">
                Grant Status
              </label>
              <select
                id="grant_status"
                name="grant_status"
                value={formData.grant_status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="awarded">Awarded</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label htmlFor="grant_amount" className="block text-sm font-medium text-gray-700">
                Grant Amount
              </label>
              <input
                type="number"
                id="grant_amount"
                name="grant_amount"
                value={formData.grant_amount}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="grant_deadline" className="block text-sm font-medium text-gray-700">
              Grant Deadline
            </label>
            <input
              type="date"
              id="grant_deadline"
              name="grant_deadline"
              value={formData.grant_deadline}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fundraising Campaign</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="campaign_type" className="block text-sm font-medium text-gray-700">
                Campaign Type
              </label>
              <select
                id="campaign_type"
                name="campaign_type"
                value={formData.campaign_type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="annual">Annual</option>
                <option value="capital">Capital</option>
                <option value="emergency">Emergency</option>
                <option value="program">Program</option>
              </select>
            </div>

            <div>
              <label htmlFor="campaign_goal" className="block text-sm font-medium text-gray-700">
                Campaign Goal
              </label>
              <input
                type="number"
                id="campaign_goal"
                name="campaign_goal"
                value={formData.campaign_goal}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="campaign_deadline" className="block text-sm font-medium text-gray-700">
              Campaign Deadline
            </label>
            <input
              type="date"
              id="campaign_deadline"
              name="campaign_deadline"
              value={formData.campaign_deadline}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </form>
  );
} 