'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Donor } from '../../lib/types';
import { createDonorService } from '../../lib/donorService';
import { aiService } from '../../lib/aiService';
import { ChartBarIcon, UserGroupIcon, CurrencyDollarIcon, LightBulbIcon, SparklesIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import AIInsightsSidebar from '../../components/AIInsightsSidebar';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsData {
  totalDonors: number;
  totalRevenue: number;
  averageDonation: number;
  retentionRate: number;
  newDonors: number;
  returningDonors: number;
  highValueDonors: number;
  engagementScore: number;
}

export default function Analytics() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donorService, setDonorService] = useState<ReturnType<typeof createDonorService> | null>(null);
  const [showAIInsights, setShowAIInsights] = useState(false);

  useEffect(() => {
    const supabase = createClientComponentClient();
    setDonorService(createDonorService(supabase));
  }, []);

  useEffect(() => {
    if (donorService) {
      loadDonors();
    }
  }, [donorService]);

  const loadDonors = async () => {
    if (!donorService) return;
    try {
      setLoading(true);
      const data = await donorService.getDonors();
      setDonors(data);
      calculateAnalytics(data);
    } catch (err) {
      setError('Failed to load donor data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (donorData: Donor[]) => {
    const totalRevenue = donorData.reduce((sum, donor) => sum + donor.amount, 0);
    const averageDonation = totalRevenue / donorData.length;
    const newDonors = donorData.filter(donor => {
      if (!donor.created_at) return false;
      const donorDate = new Date(donor.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return donorDate > thirtyDaysAgo;
    }).length;
    const returningDonors = donorData.filter(donor => {
      if (!donor.last_donation) return false;
      const lastDonationDate = new Date(donor.last_donation);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      return lastDonationDate > ninetyDaysAgo;
    }).length;
    const highValueDonors = donorData.filter(donor => donor.amount > averageDonation * 2).length;
    const retentionRate = (returningDonors / donorData.length) * 100;
    const totalEngagementScore = donorData.reduce((sum, donor) => sum + (donor.engagement || 0), 0);
    const engagementScore = totalEngagementScore / donorData.length;

    setAnalytics({
      totalDonors: donorData.length,
      totalRevenue,
      averageDonation,
      retentionRate,
      newDonors,
      returningDonors,
      highValueDonors,
      engagementScore,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className={`flex-1 overflow-y-auto ${showAIInsights ? 'mr-96' : ''}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <button
              onClick={() => setShowAIInsights(!showAIInsights)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              {showAIInsights ? 'Hide AI Insights' : 'Show AI Insights'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Donors</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics?.totalDonors || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <CurrencyDollarIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${analytics?.totalRevenue.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Retention Rate</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics?.retentionRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <LightBulbIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Engagement Score</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics?.engagementScore.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Donor Segments */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Donor Segments</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">New Donors</span>
                    <span className="font-medium">{analytics?.newDonors || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${((analytics?.newDonors || 0) / (analytics?.totalDonors || 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Returning Donors</span>
                    <span className="font-medium">{analytics?.returningDonors || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${((analytics?.returningDonors || 0) / (analytics?.totalDonors || 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">High-Value Donors</span>
                    <span className="font-medium">{analytics?.highValueDonors || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${((analytics?.highValueDonors || 0) / (analytics?.totalDonors || 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Overview</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Average Donation</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${analytics?.averageDonation.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Revenue per Donor</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${((analytics?.totalRevenue || 0) / (analytics?.totalDonors || 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">High-Value Donor Revenue</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${((analytics?.totalRevenue || 0) * 0.8).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Strategic Recommendations</h2>
            <div className="space-y-4">
              {analytics && (
                <>
                  {analytics.retentionRate < 50 && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h3 className="text-sm font-medium text-yellow-800">Improve Donor Retention</h3>
                      <p className="mt-1 text-sm text-yellow-700">
                        Your retention rate is below 50%. Consider implementing a donor stewardship program and increasing engagement activities.
                      </p>
                    </div>
                  )}
                  {analytics.engagementScore < 2 && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h3 className="text-sm font-medium text-red-800">Low Engagement Alert</h3>
                      <p className="mt-1 text-sm text-red-700">
                        The overall engagement score is low. Focus on personalized communication and impact reporting to increase donor engagement.
                      </p>
                    </div>
                  )}
                  {analytics.highValueDonors < 5 && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-800">High-Value Donor Opportunity</h3>
                      <p className="mt-1 text-sm text-blue-700">
                        You have fewer than 5 high-value donors. Consider developing a major donor program and identifying potential high-value prospects.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Sidebar */}
      {showAIInsights && (
        <AIInsightsSidebar
          donorData={donors}
          onClose={() => setShowAIInsights(false)}
        />
      )}
    </div>
  );
} 