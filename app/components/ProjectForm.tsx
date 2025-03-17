'use client';

import { useState } from 'react';
import { Project } from '@/app/lib/projectService';
import { Grant, FundraisingCampaign } from '@/app/lib/types';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function ProjectForm({ project, onSubmit, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
    status: project?.status || 'planned',
    budget: project?.budget || 0,
    impact_target: project?.impact_target || '',
    impact_current: project?.impact_current || 0,
    // Grant fields
    grant_title: project?.grant?.title || '',
    grant_organization: project?.grant?.organization || '',
    grant_amount: project?.grant?.amount || 0,
    grant_deadline: project?.grant?.deadline || '',
    grant_status: project?.grant?.status || 'draft',
    grant_description: project?.grant?.description || '',
    grant_impact_statement: project?.grant?.impact_statement || '',
    // Fundraising campaign fields
    campaign_name: project?.campaign?.name || '',
    campaign_description: project?.campaign?.description || '',
    campaign_goal: project?.campaign?.goal || 0,
    campaign_current_amount: project?.campaign?.current_amount || 0,
    campaign_start_date: project?.campaign?.start_date || '',
    campaign_end_date: project?.campaign?.end_date || '',
    campaign_status: project?.campaign?.status || 'planned',
    campaign_type: project?.campaign?.type || 'program',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData = {
      ...formData,
      grant: {
        title: formData.grant_title,
        organization: formData.grant_organization,
        amount: formData.grant_amount,
        deadline: formData.grant_deadline,
        status: formData.grant_status,
        description: formData.grant_description,
        impact_statement: formData.grant_impact_statement,
        budget: formData.budget,
      },
      campaign: {
        name: formData.campaign_name,
        description: formData.campaign_description,
        goal: formData.campaign_goal,
        current_amount: formData.campaign_current_amount,
        start_date: formData.campaign_start_date,
        end_date: formData.campaign_end_date,
        status: formData.campaign_status,
        type: formData.campaign_type,
      },
    };

    onSubmit(projectData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Project Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Budget</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
              required
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Impact Target</label>
            <input
              type="text"
              value={formData.impact_target}
              onChange={(e) => setFormData({ ...formData, impact_target: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Impact</label>
            <input
              type="number"
              value={formData.impact_current}
              onChange={(e) => setFormData({ ...formData, impact_current: Number(e.target.value) })}
              required
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Grant Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Grant Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Grant Title</label>
            <input
              type="text"
              value={formData.grant_title}
              onChange={(e) => setFormData({ ...formData, grant_title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization</label>
            <input
              type="text"
              value={formData.grant_organization}
              onChange={(e) => setFormData({ ...formData, grant_organization: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Grant Amount</label>
            <input
              type="number"
              value={formData.grant_amount}
              onChange={(e) => setFormData({ ...formData, grant_amount: Number(e.target.value) })}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Deadline</label>
            <input
              type="date"
              value={formData.grant_deadline}
              onChange={(e) => setFormData({ ...formData, grant_deadline: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Grant Status</label>
            <select
              value={formData.grant_status}
              onChange={(e) => setFormData({ ...formData, grant_status: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="awarded">Awarded</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Grant Description</label>
          <textarea
            value={formData.grant_description}
            onChange={(e) => setFormData({ ...formData, grant_description: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Impact Statement</label>
          <textarea
            value={formData.grant_impact_statement}
            onChange={(e) => setFormData({ ...formData, grant_impact_statement: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Fundraising Campaign Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Fundraising Campaign</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
            <input
              type="text"
              value={formData.campaign_name}
              onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Campaign Type</label>
            <select
              value={formData.campaign_type}
              onChange={(e) => setFormData({ ...formData, campaign_type: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="annual">Annual</option>
              <option value="capital">Capital</option>
              <option value="emergency">Emergency</option>
              <option value="program">Program</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Goal</label>
            <input
              type="number"
              value={formData.campaign_goal}
              onChange={(e) => setFormData({ ...formData, campaign_goal: Number(e.target.value) })}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Amount</label>
            <input
              type="number"
              value={formData.campaign_current_amount}
              onChange={(e) => setFormData({ ...formData, campaign_current_amount: Number(e.target.value) })}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={formData.campaign_start_date}
              onChange={(e) => setFormData({ ...formData, campaign_start_date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={formData.campaign_end_date}
              onChange={(e) => setFormData({ ...formData, campaign_end_date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Campaign Status</label>
            <select
              value={formData.campaign_status}
              onChange={(e) => setFormData({ ...formData, campaign_status: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Campaign Description</label>
          <textarea
            value={formData.campaign_description}
            onChange={(e) => setFormData({ ...formData, campaign_description: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {project ? 'Update' : 'Create'} Project
        </button>
      </div>
    </form>
  );
} 