'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/app/lib/types';
import { Grant, FundraisingCampaign } from '@/app/lib/types';
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
  mission: string;
  goals: string[];
  target_audience: string;
  location: string;
  timeline: string;
  budget: number;
  status: Project['status'];
  start_date: string;
  end_date: string;
  impact_target: string;
  impact_metric: string;
  team_size: number;
  team_roles: string[];
  grant_status?: Project['grant_status'];
  grant_amount?: number;
  grant_deadline?: string;
  campaign_type?: Project['campaign_type'];
  campaign_goal?: number;
  campaign_deadline?: string;
}

export default function ProjectForm({ project, onSubmit, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: project?.name || '',
    description: project?.description || '',
    mission: project?.mission || '',
    goals: project?.goals || [],
    target_audience: project?.target_audience || '',
    location: project?.location || '',
    timeline: project?.timeline || '',
    budget: project?.budget || 0,
    status: project?.status || 'planning',
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
    impact_target: project?.impact_target || '',
    impact_metric: project?.impact_metric || '',
    team_size: project?.team_size || 0,
    team_roles: project?.team_roles || [],
    grant_status: project?.grant_status,
    grant_amount: project?.grant_amount,
    grant_deadline: project?.grant_deadline,
    campaign_type: project?.campaign_type,
    campaign_goal: project?.campaign_goal,
    campaign_deadline: project?.campaign_deadline
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'team_roles') {
      setFormData(prev => ({
        ...prev,
        team_roles: value.split(',').map((role: string) => role.trim()).filter(Boolean)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert project status to campaign status
      const campaignStatus: FundraisingCampaign['status'] = formData.status === 'planning' ? 'planned' :
                                                          formData.status === 'on_hold' ? 'cancelled' :
                                                          formData.status === 'active' ? 'active' :
                                                          'completed';

      const projectData = {
        name: formData.name,
        description: formData.description,
        mission: formData.mission,
        goals: formData.goals,
        target_audience: formData.target_audience,
        location: formData.location,
        timeline: formData.timeline,
        budget: Number(formData.budget),
        status: formData.status,
        start_date: formData.start_date,
        end_date: formData.end_date,
        impact_target: formData.impact_target,
        impact_metric: formData.impact_metric,
        team_size: Number(formData.team_size),
        team_roles: formData.team_roles,
        grant_status: formData.grant_status,
        grant_amount: Number(formData.grant_amount),
        grant_deadline: formData.grant_deadline,
        campaign_type: formData.campaign_type,
        campaign_goal: Number(formData.campaign_goal),
        campaign_deadline: formData.campaign_deadline
      };

      await onSubmit(projectData);
    } catch (err) {
      setError('Failed to create project');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
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
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="mission" className="block text-sm font-medium text-gray-700">
          Mission
        </label>
        <textarea
          id="mission"
          name="mission"
          value={formData.mission}
          onChange={handleChange}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="target_audience" className="block text-sm font-medium text-gray-700">
          Target Audience
        </label>
        <input
          type="text"
          id="target_audience"
          name="target_audience"
          value={formData.target_audience}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Location
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="timeline" className="block text-sm font-medium text-gray-700">
          Timeline
        </label>
        <input
          type="text"
          id="timeline"
          name="timeline"
          value={formData.timeline}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
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
          required
          min="0"
          step="0.01"
        />
      </div>

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
          required
        >
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
        </select>
      </div>

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
          required
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
          required
        />
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
          required
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
          required
        />
      </div>

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
          required
          min="0"
        />
      </div>

      <div>
        <label htmlFor="team_roles" className="block text-sm font-medium text-gray-700">
          Team Roles (comma-separated)
        </label>
        <input
          type="text"
          id="team_roles"
          name="team_roles"
          value={formData.team_roles.join(', ')}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

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
          <option value="">Select a status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
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
          value={formData.grant_amount || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          min="0"
          step="0.01"
        />
      </div>

      <div>
        <label htmlFor="grant_deadline" className="block text-sm font-medium text-gray-700">
          Grant Deadline
        </label>
        <input
          type="date"
          id="grant_deadline"
          name="grant_deadline"
          value={formData.grant_deadline || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

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
          <option value="">Select a type</option>
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
          value={formData.campaign_goal || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          min="0"
          step="0.01"
        />
      </div>

      <div>
        <label htmlFor="campaign_deadline" className="block text-sm font-medium text-gray-700">
          Campaign Deadline
        </label>
        <input
          type="date"
          id="campaign_deadline"
          name="campaign_deadline"
          value={formData.campaign_deadline || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {project ? 'Update' : 'Create'} Project
        </button>
      </div>
    </form>
  );
} 