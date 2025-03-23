'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { PlusIcon, ChartBarIcon, LightBulbIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { FundraisingStrategy } from '@/app/lib/types';
import CreateStrategyForm from './components/CreateStrategyForm';

export default function StrategyPage() {
  const [strategies, setStrategies] = useState<FundraisingStrategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const { data, error } = await supabase
        .from('fundraising_strategies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStrategies(data || []);
    } catch (err) {
      setError('Failed to fetch strategies');
      console.error('Error fetching strategies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchStrategies();
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchStrategies}
          className="text-purple-600 hover:text-purple-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Strategy</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Strategy
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      ) : strategies.length === 0 ? (
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No strategies</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new strategy.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Strategy
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {strategy.organization_name}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    strategy.status === 'active' ? 'bg-green-100 text-green-800' :
                    strategy.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    strategy.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {strategy.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {strategy.organization_type}
                </p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-gray-900">{strategy.progress}%</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${strategy.progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Key Insights</h4>
                  <ul className="mt-2 space-y-1">
                    {strategy.insights.slice(0, 2).map((insight, index) => (
                      <li key={index} className="flex items-start">
                        <LightBulbIcon className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-500">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex justify-between">
                  <a
                    href={`/fundraising/${strategy.id}`}
                    className="text-sm font-medium text-purple-600 hover:text-purple-500"
                  >
                    View Details
                  </a>
                  <button
                    onClick={() => {
                      // TODO: Implement strategy update
                    }}
                    className="text-sm font-medium text-purple-600 hover:text-purple-500"
                  >
                    Update Progress
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateForm && (
        <CreateStrategyForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
} 