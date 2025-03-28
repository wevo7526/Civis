'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { FundraisingStrategy } from '@/app/lib/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  ChartBarIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  BanknotesIcon,
  HeartIcon,
  BuildingOfficeIcon,
  UserPlusIcon,
  ChartPieIcon,
  TagIcon,
  FolderIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';

interface TimelineData {
  month: string;
  expectedRevenue: number;
  cumulativeRevenue: number;
}

interface SavedStrategy extends FundraisingStrategy {
  id: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#f97316', '#059669'];

export default function FundraisingPage() {
  const [strategies, setStrategies] = useState<FundraisingStrategy[]>([]);
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [savingStrategyId, setSavingStrategyId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchSavedStrategies();
  }, []);

  const fetchSavedStrategies = async () => {
    try {
      const { data, error } = await supabase
        .from('fundraising_strategies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map database fields to FundraisingStrategy format
      const mappedStrategies = (data || []).map(strategy => ({
        id: strategy.id,
        name: strategy.name,
        description: strategy.description,
        target_amount: strategy.target_amount,
        current_amount: strategy.current_amount,
        start_date: strategy.start_date,
        end_date: strategy.end_date,
        status: strategy.status,
        type: strategy.type,
        progress: strategy.progress,
        user_id: strategy.user_id,
        created_at: strategy.created_at,
        updated_at: strategy.updated_at,
        notes: strategy.notes,
        metrics: strategy.metrics,
        insights: strategy.insights,
        recommendations: strategy.recommendations
      }));

      setSavedStrategies(mappedStrategies);
    } catch (error) {
      console.error('Error fetching saved strategies:', error);
    }
  };

  const handleGenerateStrategies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/generate-fundraising-strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          requirements: {
            includeMetrics: true,
            includeTimeline: true,
            includeDonorSegments: true,
            includeRiskFactors: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate strategies');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Transform the API response into FundraisingStrategy format
      const transformedStrategies = data.strategies.map((strategy: any) => ({
        id: strategy.id,
        name: strategy.name,
        description: strategy.description,
        target_amount: strategy.targetAmount,
        current_amount: 0,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + strategy.duration * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'draft',
        type: 'individual', // Default type, can be updated based on strategy details
        progress: 0,
        user_id: '', // Will be set when saving
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metrics: {
          donor_count: strategy.donorSegments.reduce((acc: number, segment: any) => acc + segment.percentage, 0),
          average_donation: strategy.donorSegments.reduce((acc: number, segment: any) => acc + segment.averageGift, 0) / strategy.donorSegments.length,
          conversion_rate: strategy.successProbability,
          engagement_rate: 0 // Can be calculated based on actual data
        },
        insights: {
          performance_analysis: `Expected ROI: ${strategy.expectedROI}%`,
          trend_analysis: 'Based on historical data and market conditions',
          risk_assessment: strategy.riskFactors.map((risk: any) => `${risk.factor} (${risk.impact} impact)`).join(', '),
          opportunity_analysis: 'Based on donor segments and market potential'
        },
        recommendations: {
          short_term: strategy.riskFactors.map((risk: any) => risk.mitigation),
          long_term: ['Develop donor relationships', 'Build sustainable funding streams'],
          priority_actions: ['Set up tracking system', 'Begin donor outreach']
        }
      }));

      setStrategies(transformedStrategies);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate strategies');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStrategy = async (strategy: FundraisingStrategy) => {
    try {
      setSavingStrategyId(strategy.id);
      setError(null);

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Please sign in to save strategies');
      }

      // Transform the strategy to match the database schema
      const { error: saveError } = await supabase
        .from('fundraising_strategies')
        .insert({
          name: strategy.name,
          description: strategy.description,
          target_amount: strategy.target_amount,
          duration: Math.ceil((new Date(strategy.end_date).getTime() - new Date(strategy.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)), // Convert to months
          success_probability: strategy.metrics?.conversion_rate || 0,
          cost_to_implement: strategy.metrics?.average_donation || 0,
          expected_roi: parseFloat(strategy.insights?.performance_analysis?.match(/\d+/)?.[0] || '0'),
          donor_segments: {
            segments: strategy.metrics?.donor_count ? [{
              name: 'General',
              percentage: strategy.metrics.donor_count,
              averageGift: strategy.metrics.average_donation || 0
            }] : []
          },
          timeline_data: {
            start_date: strategy.start_date,
            end_date: strategy.end_date,
            target_amount: strategy.target_amount,
            current_amount: strategy.current_amount || 0
          },
          risk_factors: strategy.insights?.risk_assessment ? [{
            factor: strategy.insights.risk_assessment,
            impact: 'medium',
            mitigation: strategy.recommendations?.short_term?.[0] || 'No mitigation plan'
          }] : [],
          prompt: prompt,
          created_by: user.id
        });

      if (saveError) {
        console.error('Error saving strategy:', saveError);
        throw new Error(saveError.message || 'Failed to save strategy');
      }

      // Refresh saved strategies
      await fetchSavedStrategies();

      // Show success message
      const successMessage = `Strategy "${strategy.name}" saved successfully`;
      setError(successMessage);

      // Clear the error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);

    } catch (error) {
      console.error('Error saving strategy:', error);
      setError(error instanceof Error ? error.message : 'Failed to save strategy');
    } finally {
      setSavingStrategyId(null);
    }
  };

  const handleDeleteStrategy = async (strategyId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Please sign in to delete strategies');
      }

      // Delete the strategy using created_by instead of user_id
      const { error: deleteError } = await supabase
        .from('fundraising_strategies')
        .delete()
        .eq('id', strategyId)
        .eq('created_by', user.id);

      if (deleteError) {
        console.error('Error deleting strategy:', deleteError);
        if (deleteError.code === 'PGRST116') {
          throw new Error('Strategy not found or you do not have permission to delete it');
        }
        throw new Error(deleteError.message || 'Failed to delete strategy');
      }

      // Refresh saved strategies
      await fetchSavedStrategies();

      // Show success message
      const successMessage = 'Strategy deleted successfully';
      setError(successMessage);

      // Clear the error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);

    } catch (error) {
      console.error('Error deleting strategy:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete strategy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fundraising Strategy Analysis</h1>
            <p className="mt-2 text-gray-600">Generate and save fundraising strategies</p>
          </div>
        </div>

        {/* Strategy Generation */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Generate Strategies</h2>
            </div>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your fundraising goals and target audience..."
                className="w-full pl-5 pr-32 py-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-gray-50/50"
                rows={3}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <button
                  onClick={handleGenerateStrategies}
                  disabled={loading || !prompt.trim()}
                  className={`inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white ${
                    loading || !prompt.trim()
                      ? 'bg-purple-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-sm hover:shadow-md`}
                >
                  {loading ? (
                    <>
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Generate Strategies
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Generated Strategies */}
        {strategies.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Generated Strategies</h2>
              <p className="text-sm text-gray-500">Review and save the strategies you like</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {strategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  onSave={handleSaveStrategy}
                  saving={savingStrategyId === strategy.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Saved Strategies */}
        {savedStrategies.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Saved Strategies</h2>
              <p className="text-sm text-gray-500">Your saved fundraising strategies</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {savedStrategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  isSaved={true}
                  created_at={strategy.created_at}
                  onDelete={handleDeleteStrategy}
                  deleting={loading}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={`px-4 py-3 rounded-lg ${
            error.includes('saved successfully') 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

interface StrategyCardProps {
  strategy: FundraisingStrategy;
  onSave?: (strategy: FundraisingStrategy) => Promise<void>;
  onDelete?: (strategyId: string) => Promise<void>;
  saving?: boolean;
  deleting?: boolean;
  isSaved?: boolean;
  created_at?: string;
}

function StrategyCard({ strategy, onSave, onDelete, saving, deleting, isSaved, created_at }: StrategyCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{strategy.name}</h3>
          <p className="text-gray-600 mt-1">{strategy.description}</p>
          {created_at && (
            <p className="text-sm text-gray-500 mt-1">
              Created {new Date(created_at).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Success Rate:</span>
          <span className="text-sm font-semibold text-green-600">{strategy.progress}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500">Target Amount</h4>
          <p className="text-2xl font-bold text-gray-900">${strategy.target_amount.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500">Current Amount</h4>
          <p className="text-2xl font-bold text-gray-900">
            ${(strategy.current_amount || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500">Start Date</h4>
          <p className="text-2xl font-bold text-gray-900">{new Date(strategy.start_date).toLocaleDateString()}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500">End Date</h4>
          <p className="text-2xl font-bold text-gray-900">{new Date(strategy.end_date).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Progress</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[
              { date: strategy.start_date, amount: 0 },
              { date: strategy.end_date, amount: strategy.target_amount }
            ]}>
              <defs>
                <linearGradient id={`color${strategy.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                labelFormatter={(label) => label}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#8884d8"
                fillOpacity={1}
                fill={`url(#color${strategy.id})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-2">
        {strategy.metrics?.donor_count && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Donor Count</span>
            <span className="text-sm font-medium">{strategy.metrics.donor_count}</span>
          </div>
        )}
        {strategy.metrics?.average_donation && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Average Donation</span>
            <span className="text-sm font-medium">${strategy.metrics.average_donation.toLocaleString()}</span>
          </div>
        )}
        {strategy.metrics?.conversion_rate && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Conversion Rate</span>
            <span className="text-sm font-medium">{strategy.metrics.conversion_rate}%</span>
          </div>
        )}
        {strategy.metrics?.engagement_rate && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Engagement Rate</span>
            <span className="text-sm font-medium">{strategy.metrics.engagement_rate}%</span>
          </div>
        )}
      </div>

      {/* Donor Segments */}
      {strategy.insights?.performance_analysis && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Performance Analysis</h4>
          <p className="text-sm text-gray-500">{strategy.insights.performance_analysis}</p>
        </div>
      )}

      {/* Recommendations */}
      {strategy.recommendations?.short_term && strategy.recommendations.short_term.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Short-term Recommendations</h4>
          <ul className="list-disc list-inside space-y-1">
            {strategy.recommendations.short_term.map((s: string) => (
              <li key={s} className="text-sm text-gray-500">{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Assessment */}
      {strategy.insights?.risk_assessment && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Risk Assessment</h4>
          <p className="text-sm text-gray-500">{strategy.insights.risk_assessment}</p>
        </div>
      )}

      {/* Priority Actions */}
      {strategy.recommendations?.priority_actions && strategy.recommendations.priority_actions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Priority Actions</h4>
          <ul className="list-disc list-inside space-y-1">
            {strategy.recommendations.priority_actions.map((action: string, index: number) => (
              <li key={index} className="text-sm text-gray-500">{action}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-2">
        {onSave && !isSaved && (
          <button
            onClick={() => onSave(strategy)}
            disabled={saving}
            className={`flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white ${
              saving
                ? 'bg-purple-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200`}
          >
            {saving ? (
              <>
                <ArrowTrendingUpIcon className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FolderIcon className="h-4 w-4 mr-2" />
                Save Strategy
              </>
            )}
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(strategy.id)}
            disabled={deleting}
            className={`flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white ${
              deleting
                ? 'bg-red-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200`}
          >
            {deleting ? (
              <>
                <ArrowTrendingUpIcon className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Strategy
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
} 