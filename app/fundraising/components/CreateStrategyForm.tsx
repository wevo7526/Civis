'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CreateStrategyFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateStrategyForm({ onClose, onSuccess }: CreateStrategyFormProps) {
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: '',
    targetAmount: '',
    timeframe: '',
    currentDonors: '',
    mission: '',
    previousFundraising: '',
    keyPrograms: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGenerating(true);

    try {
      // First, generate the AI strategy
      const response = await fetch('/api/ai/generate-fundraising-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate strategy');
      }

      const { strategy, insights, recommendations } = await response.json();

      // Save the strategy to the database
      const { error: dbError } = await supabase
        .from('fundraising_strategies')
        .insert({
          organization_name: formData.organizationName,
          organization_type: formData.organizationType,
          target_amount: parseFloat(formData.targetAmount),
          timeframe: formData.timeframe,
          current_donors: parseInt(formData.currentDonors),
          status: 'active',
          progress: 0,
          insights,
          recommendations,
          strategy_content: strategy,
          mission: formData.mission,
          previous_fundraising: formData.previousFundraising,
          key_programs: formData.keyPrograms,
        });

      if (dbError) throw dbError;

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create strategy');
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Create Fundraising Strategy</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                Organization Name
              </label>
              <input
                type="text"
                id="organizationName"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="organizationType" className="block text-sm font-medium text-gray-700">
                Organization Type
              </label>
              <select
                id="organizationType"
                name="organizationType"
                value={formData.organizationType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              >
                <option value="">Select a type</option>
                <option value="nonprofit">Nonprofit</option>
                <option value="education">Education</option>
                <option value="healthcare">Healthcare</option>
                <option value="environmental">Environmental</option>
                <option value="social">Social Services</option>
                <option value="arts">Arts & Culture</option>
                <option value="religious">Religious</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700">
                Target Amount ($)
              </label>
              <input
                type="number"
                id="targetAmount"
                name="targetAmount"
                value={formData.targetAmount}
                onChange={handleChange}
                min="0"
                step="1000"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700">
                Fundraising Timeframe
              </label>
              <select
                id="timeframe"
                name="timeframe"
                value={formData.timeframe}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              >
                <option value="">Select a timeframe</option>
                <option value="3 months">3 months</option>
                <option value="6 months">6 months</option>
                <option value="1 year">1 year</option>
                <option value="2 years">2 years</option>
              </select>
            </div>

            <div>
              <label htmlFor="currentDonors" className="block text-sm font-medium text-gray-700">
                Current Number of Donors
              </label>
              <input
                type="number"
                id="currentDonors"
                name="currentDonors"
                value={formData.currentDonors}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="mission" className="block text-sm font-medium text-gray-700">
              Organization Mission
            </label>
            <textarea
              id="mission"
              name="mission"
              value={formData.mission}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Briefly describe your organization's mission and goals..."
            />
          </div>

          <div>
            <label htmlFor="previousFundraising" className="block text-sm font-medium text-gray-700">
              Previous Fundraising Experience
            </label>
            <textarea
              id="previousFundraising"
              name="previousFundraising"
              value={formData.previousFundraising}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Describe your organization's previous fundraising efforts and results..."
            />
          </div>

          <div>
            <label htmlFor="keyPrograms" className="block text-sm font-medium text-gray-700">
              Key Programs or Initiatives
            </label>
            <textarea
              id="keyPrograms"
              name="keyPrograms"
              value={formData.keyPrograms}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="List your main programs or initiatives that need funding..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || generating}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Strategy...
                </>
              ) : (
                'Create Strategy'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 