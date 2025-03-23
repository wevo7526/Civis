'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CreateStrategyFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateStrategyForm({ onClose, onSuccess }: CreateStrategyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      organization_name: formData.get('organization_name'),
      organization_type: formData.get('organization_type'),
      target_amount: parseFloat(formData.get('target_amount') as string),
      timeframe: formData.get('timeframe'),
      current_donors: parseInt(formData.get('current_donors') as string),
      mission: formData.get('mission'),
      previous_fundraising: formData.get('previous_fundraising'),
      key_programs: formData.get('key_programs'),
      status: 'draft',
      progress: 0,
      insights: [],
      recommendations: [],
      strategy_content: '',
    };

    try {
      const { error } = await supabase
        .from('fundraising_strategies')
        .insert([data]);

      if (error) throw error;
      onSuccess();
    } catch (err) {
      setError('Failed to create strategy');
      console.error('Error creating strategy:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Create New Strategy</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div>
            <label htmlFor="organization_name" className="block text-sm font-medium text-gray-700">
              Organization Name
            </label>
            <input
              type="text"
              name="organization_name"
              id="organization_name"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="organization_type" className="block text-sm font-medium text-gray-700">
              Organization Type
            </label>
            <select
              name="organization_type"
              id="organization_type"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            >
              <option value="">Select a type</option>
              <option value="nonprofit">Nonprofit</option>
              <option value="charity">Charity</option>
              <option value="social_enterprise">Social Enterprise</option>
              <option value="community_group">Community Group</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700">
              Target Amount
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="target_amount"
                id="target_amount"
                required
                min="0"
                step="0.01"
                className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700">
              Timeframe
            </label>
            <select
              name="timeframe"
              id="timeframe"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            >
              <option value="">Select a timeframe</option>
              <option value="3_months">3 Months</option>
              <option value="6_months">6 Months</option>
              <option value="1_year">1 Year</option>
              <option value="2_years">2 Years</option>
              <option value="5_years">5 Years</option>
            </select>
          </div>

          <div>
            <label htmlFor="current_donors" className="block text-sm font-medium text-gray-700">
              Current Number of Donors
            </label>
            <input
              type="number"
              name="current_donors"
              id="current_donors"
              required
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="mission" className="block text-sm font-medium text-gray-700">
              Mission Statement
            </label>
            <textarea
              name="mission"
              id="mission"
              required
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="previous_fundraising" className="block text-sm font-medium text-gray-700">
              Previous Fundraising Experience
            </label>
            <textarea
              name="previous_fundraising"
              id="previous_fundraising"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="key_programs" className="block text-sm font-medium text-gray-700">
              Key Programs or Initiatives
            </label>
            <textarea
              name="key_programs"
              id="key_programs"
              required
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Strategy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 