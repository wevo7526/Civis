'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChartBarIcon, LightBulbIcon, ArrowTrendingUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface FundraisingStrategy {
  id: string;
  organizationName: string;
  organizationType: string;
  targetAmount: number;
  timeframe: string;
  currentDonors: number;
  status: 'active' | 'completed' | 'planned';
  progress: number;
  insights: string[];
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

export default function FundraisingPage() {
  const [strategies, setStrategies] = useState<FundraisingStrategy[]>([]);
  const [loading, setLoading] = useState(true);
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
      setError(err instanceof Error ? err.message : 'Failed to fetch strategies');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fundraising Strategies</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage AI-powered fundraising strategies for your organization
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ChartBarIcon className="h-5 w-5 mr-2" />
          Create New Strategy
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : strategies.length === 0 ? (
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No fundraising strategies</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new fundraising strategy.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create New Strategy
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{strategy.organizationName}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  strategy.status === 'active' ? 'bg-green-100 text-green-800' :
                  strategy.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {strategy.status.charAt(0).toUpperCase() + strategy.status.slice(1)}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Target Amount</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${strategy.targetAmount.toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Progress</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${strategy.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{strategy.progress}% complete</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Current Donors</p>
                  <p className="text-lg font-semibold text-gray-900">{strategy.currentDonors}</p>
                </div>

                {strategy.insights && strategy.insights.length > 0 && (
                  <div>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <LightBulbIcon className="h-4 w-4 mr-1" />
                      Latest Insights
                    </div>
                    <p className="text-sm text-gray-700">{strategy.insights[0]}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {/* TODO: Implement view details */}}
                  className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  View Details
                </button>
                <button
                  onClick={() => {/* TODO: Implement edit */}}
                  className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                  Update Progress
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TODO: Add CreateStrategyForm component */}
    </div>
  );
} 