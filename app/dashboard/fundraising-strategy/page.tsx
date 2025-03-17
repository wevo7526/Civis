'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { MegaphoneIcon } from '@heroicons/react/24/outline';

export default function FundraisingStrategy() {
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [currentDonors, setCurrentDonors] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedStrategy, setGeneratedStrategy] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGeneratedStrategy(null);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateFundraisingStrategy',
          data: {
            organizationName,
            organizationType,
            targetAmount: parseFloat(targetAmount),
            timeframe,
            currentDonors: parseInt(currentDonors),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate fundraising strategy');
      }

      const data = await response.json();
      setGeneratedStrategy(data.strategy);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center space-x-3 mb-8">
        <MegaphoneIcon className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">AI Fundraising Strategy Assistant</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
              Organization Name
            </label>
            <input
              type="text"
              id="organizationName"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
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
              value={organizationType}
              onChange={(e) => setOrganizationType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="">Select a type</option>
              <option value="education">Education</option>
              <option value="healthcare">Healthcare</option>
              <option value="environmental">Environmental</option>
              <option value="social">Social Services</option>
              <option value="arts">Arts & Culture</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700">
              Fundraising Goal ($)
            </label>
            <input
              type="number"
              id="targetAmount"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
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
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
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
              value={currentDonors}
              onChange={(e) => setCurrentDonors(e.target.value)}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Fundraising Strategy'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {generatedStrategy && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Generated Fundraising Strategy</h2>
            <div className="bg-gray-50 rounded-md p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">{generatedStrategy}</pre>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  const blob = new Blob([generatedStrategy], { type: 'text/plain' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${organizationName.toLowerCase().replace(/\s+/g, '-')}-fundraising-strategy.txt`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Download Strategy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 