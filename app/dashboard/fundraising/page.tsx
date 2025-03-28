'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ChartPieIcon,
  BellIcon,
  DocumentTextIcon,
  LightBulbIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { aiService } from '@/lib/aiService';
import { Donor, Project, Event, FundraisingStrategy } from '@/lib/types';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface FundraisingMetrics {
  totalRaised: number;
  donorCount: number;
  averageGift: number;
  retentionRate: number;
  acquisitionCost: number;
  lifetimeValue: number;
  donorSegments: {
    major: number;
    mid: number;
    small: number;
  };
  engagementLevels: {
    high: number;
    medium: number;
    low: number;
  };
  strategyAlignment: {
    donorCount: number;
    totalPotential: number;
    alignmentScore: number;
  };
  donorStrategyMatches: {
    donorId: string;
    donorName: string;
    matchedStrategies: string[];
    potentialImpact: number;
  }[];
}

interface AIInsights {
  donorInsights: string;
  fundraisingInsights: string;
  recommendations: string[];
  risks: string[];
  opportunities: string[];
  strategyRecommendations: {
    strategy: string;
    donorSegment: string;
    expectedImpact: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  donorStrategyMatches: {
    donorId: string;
    donorName: string;
    matchedStrategies: string[];
    potentialImpact: number;
  }[];
}

export default function FundraisingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<FundraisingMetrics | null>(null);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [strategyData, setStrategyData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [donorsResponse, projectsResponse, eventsResponse, strategyResponse] = await Promise.all([
        supabase.from('donors').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('events').select('*'),
        supabase.from('fundraising_strategies').select('*'),
      ]);

      if (donorsResponse.error) throw donorsResponse.error;
      if (projectsResponse.error) throw projectsResponse.error;
      if (eventsResponse.error) throw eventsResponse.error;
      if (strategyResponse.error) throw strategyResponse.error;

      const donorsData = donorsResponse.data as Donor[];
      const projectsData = projectsResponse.data as Project[];
      const eventsData = eventsResponse.data as Event[];
      const strategyData = strategyResponse.data;

      setDonors(donorsData);
      setProjects(projectsData);
      setEvents(eventsData);
      setStrategyData(strategyData);

      // Calculate metrics
      const metrics = calculateMetrics(donorsData, strategyData);
      setMetrics(metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (donors: Donor[], strategy: any): FundraisingMetrics => {
    const totalRaised = donors.reduce((sum: number, donor: Donor) => sum + (donor.total_given || 0), 0);
    const donorCount = donors.length;
    const averageGift = donorCount > 0 ? totalRaised / donorCount : 0;
    
    // Calculate retention rate (donors who have given more than once)
    const repeatDonors = donors.filter(donor => {
      const donations = donors.filter(d => d.email === donor.email);
      return donations.length > 1;
    });
    const retentionRate = donorCount > 0 ? (repeatDonors.length / donorCount) * 100 : 0;

    // Calculate donor segments
    const segments = {
      major: donors.filter(d => (d.total_given || 0) >= 10000).length,
      mid: donors.filter(d => (d.total_given || 0) >= 1000 && (d.total_given || 0) < 10000).length,
      small: donors.filter(d => (d.total_given || 0) < 1000).length,
    };

    // Calculate engagement levels
    const engagementLevels = {
      high: donors.filter(d => (d.interaction_count || 0) >= 5).length,
      medium: donors.filter(d => (d.interaction_count || 0) >= 2 && (d.interaction_count || 0) < 5).length,
      low: donors.filter(d => (d.interaction_count || 0) < 2).length,
    };

    // Calculate strategy alignment
    const strategyAlignment = {
      donorCount: 0,
      totalPotential: 0,
      alignmentScore: 0,
    };

    const donorStrategyMatches = [];

    for (const donor of donors) {
      const matchedStrategies = strategy.filter((s: FundraisingStrategy) => s.donor_id === donor.id);
      const potentialImpact = matchedStrategies.reduce((sum: number, s: FundraisingStrategy) => sum + (s.impact || 0), 0);

      if (potentialImpact > 0) {
        strategyAlignment.donorCount++;
        strategyAlignment.totalPotential += potentialImpact;
        strategyAlignment.alignmentScore += (potentialImpact / (donor.total_given || 1)) * 100;

        donorStrategyMatches.push({
          donorId: donor.id,
          donorName: `${donor.first_name} ${donor.last_name}`,
          matchedStrategies: matchedStrategies.map((s: FundraisingStrategy) => s.name),
          potentialImpact,
        });
      }
    }

    strategyAlignment.alignmentScore = strategyAlignment.alignmentScore / donorCount;

    return {
      totalRaised,
      donorCount,
      averageGift,
      retentionRate,
      acquisitionCost: 5000 / donorCount, // Simplified calculation
      lifetimeValue: totalRaised / donorCount,
      donorSegments: segments,
      engagementLevels,
      strategyAlignment,
      donorStrategyMatches,
    };
  };

  const calculateStrategyAlignment = (donor: Donor) => {
    const matchedStrategies = strategyData.filter((s: FundraisingStrategy) => s.donor_id === donor.id);
    const potentialImpact = matchedStrategies.reduce((sum: number, s: FundraisingStrategy) => sum + (s.impact || 0), 0);
    
    // Calculate engagement score based on interaction count
    const engagementScore = Math.min(100, ((donor.interaction_count || 0) / 5) * 100);
    
    // Calculate giving capacity score based on total given
    const givingCapacityScore = Math.min(100, ((donor.total_given || 0) / 10000) * 100);
    
    // Calculate recency score based on last donation
    const lastDonationDate = donor.last_donation_date ? new Date(donor.last_donation_date) : null;
    const daysSinceLastDonation = lastDonationDate 
      ? Math.floor((new Date().getTime() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24))
      : 365;
    const recencyScore = Math.max(0, 100 - (daysSinceLastDonation / 3.65));
    
    // Calculate overall alignment score
    const alignmentScore = Math.round(
      (engagementScore * 0.3) + 
      (givingCapacityScore * 0.3) + 
      (recencyScore * 0.4)
    );

    // Generate insights based on scores
    const insights = [];
    if (engagementScore < 50) {
      insights.push('Low engagement - Consider increasing donor interactions');
    }
    if (givingCapacityScore < 50) {
      insights.push('Potential for increased giving - Focus on relationship building');
    }
    if (recencyScore < 50) {
      insights.push('Inactive donor - Plan re-engagement strategy');
    }
    if (matchedStrategies.length === 0) {
      insights.push('No matched strategies - Review donor profile for potential matches');
    }

    return {
      matchedStrategies,
      potentialImpact,
      alignmentScore,
      engagementScore,
      givingCapacityScore,
      recencyScore,
      insights,
      lastDonationDate,
      daysSinceLastDonation
    };
  };

  const generateInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const response = await aiService.analyzeFundraising({
        donors,
        projects,
        events,
        strategies: strategyData
      });

      if (response.success && response.content) {
        // Parse the content into sections
        const content = response.content;
        console.log('Raw AI response:', content); // Debug log

        // Split content into sections based on numbered headers
        const sections = content.split(/(?=\d+\.)/).reduce((acc: any, section: string) => {
          const trimmedSection = section.trim();
          if (!trimmedSection) return acc;

          if (trimmedSection.startsWith('1. Key Metrics Summary')) {
            // Skip the metrics section as we already have these displayed
            return acc;
          } else if (trimmedSection.startsWith('2. Performance Analysis')) {
            acc.analysis = trimmedSection
              .replace('2. Performance Analysis', '')
              .trim()
              .split('\n')
              .filter(line => line.trim())
              .map(line => line.replace(/^-\s*/, '').trim())
              .join('\n');
          } else if (trimmedSection.startsWith('3. Actionable Recommendations')) {
            acc.recommendations = trimmedSection
              .replace('3. Actionable Recommendations', '')
              .trim()
              .split('\n')
              .filter(line => line.trim().startsWith('-'))
              .map(line => line.replace(/^-\s*/, '').trim());
          } else if (trimmedSection.startsWith('4. Risk Assessment')) {
            const lines = trimmedSection
              .replace('4. Risk Assessment', '')
              .trim()
              .split('\n')
              .filter(line => line.trim())
              .map(line => line.replace(/^-\s*/, '').trim());

            acc.risks = lines
              .filter(line => line.includes('challenge:') || line.includes('needing attention:'))
              .map(line => line.replace(/^.*?:\s*/, '').trim());

            acc.opportunities = lines
              .filter(line => line.includes('opportunity:'))
              .map(line => line.replace(/^.*?:\s*/, '').trim());
          }
          return acc;
        }, {});

        // Extract summary from the beginning of the content (before the numbered sections)
        const summaryMatch = content.match(/^([^1-9].*?)(?=\d+\.)/s);
        const summary = summaryMatch ? summaryMatch[1].trim() : '';

        console.log('Parsed sections:', sections); // Debug log

        setInsights({
          donorInsights: summary, // Use the extracted summary instead of metrics
          fundraisingInsights: sections.analysis || '',
          recommendations: sections.recommendations || [],
          risks: sections.risks || [],
          opportunities: sections.opportunities || [],
          strategyRecommendations: [],
          donorStrategyMatches: []
        });
      } else {
        console.error('Failed to generate insights:', response.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Fundraising Dashboard</h1>
          <button
            onClick={() => router.push('/fundraising')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Strategy
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Total Donations</p>
                  <p className="text-2xl font-semibold text-gray-900">${metrics?.totalRaised.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Active Donors</p>
                  <p className="text-2xl font-semibold text-gray-900">{metrics?.donorCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">Avg. Donation</p>
                  <p className="text-2xl font-semibold text-gray-900">${metrics?.averageGift.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <ChartPieIcon className="h-6 w-6 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-600">Retention Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">{metrics?.retentionRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('donors')}
                className={`${
                  activeTab === 'donors'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Donors
              </button>
              <button
                onClick={() => setActiveTab('strategy')}
                className={`${
                  activeTab === 'strategy'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Strategy Alignment
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">AI Insights</h2>
                  <button
                    onClick={generateInsights}
                    disabled={isGeneratingInsights}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                      isGeneratingInsights 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {isGeneratingInsights ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Insights...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Generate Insights
                      </>
                    )}
                  </button>
                </div>

                {insights && (
                  <div className="space-y-6">
                    {/* Performance Analysis */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Performance Analysis</h4>
                      <div className="prose prose-sm max-w-none">
                        {insights.fundraisingInsights ? (
                          <div className="space-y-4">
                            {insights.fundraisingInsights.split('\n').map((line, index) => (
                              <div key={index} className="flex items-start">
                                <div className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-blue-500 mr-3"></div>
                                <p className="text-gray-600">{line}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No performance analysis available</p>
                        )}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Recommendations</h4>
                      {insights.recommendations && insights.recommendations.length > 0 ? (
                        <ul className="space-y-3">
                          {insights.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                              <span className="text-gray-600">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 italic">No recommendations available</p>
                      )}
                    </div>

                    {/* Risks and Opportunities */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-lg shadow p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Risks</h4>
                        {insights.risks && insights.risks.length > 0 ? (
                          <ul className="space-y-3">
                            {insights.risks.map((risk, index) => (
                              <li key={index} className="flex items-start">
                                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                                <span className="text-gray-600">{risk}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic">No risks identified</p>
                        )}
                      </div>
                      <div className="bg-white rounded-lg shadow p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Opportunities</h4>
                        {insights.opportunities && insights.opportunities.length > 0 ? (
                          <ul className="space-y-3">
                            {insights.opportunities.map((opp, index) => (
                              <li key={index} className="flex items-start">
                                <LightBulbIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                                <span className="text-gray-600">{opp}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic">No opportunities identified</p>
                        )}
                      </div>
                    </div>

                    {/* Summary */}
                    {insights.donorInsights && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Summary</h4>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-600">{insights.donorInsights}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'donors' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Donor List</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Donations</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Donation</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {donors.map((donor) => (
                        <tr key={donor.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{donor.first_name} {donor.last_name}</div>
                            <div className="text-sm text-gray-500">{donor.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              donor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {donor.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${donor.total_given?.toLocaleString() || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {donor.last_donation_date ? new Date(donor.last_donation_date).toLocaleDateString() : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'strategy' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Strategy Alignment</h2>
                <div className="space-y-6">
                  {donors.map((donor) => {
                    const alignment = calculateStrategyAlignment(donor);
                    return (
                      <div key={donor.id} className="bg-white border rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{donor.first_name} {donor.last_name}</h3>
                            <p className="text-sm text-gray-500">{donor.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">Overall Alignment Score</p>
                            <div className="flex items-center">
                              <div className="w-16 h-16 relative">
                                <svg className="w-full h-full" viewBox="0 0 36 36">
                                  <path
                                    d="M18 2.0845
                                      a 15.9155 15.9155 0 0 1 0 31.831
                                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#E5E7EB"
                                    strokeWidth="3"
                                  />
                                  <path
                                    d="M18 2.0845
                                      a 15.9155 15.9155 0 0 1 0 31.831
                                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke={alignment.alignmentScore >= 70 ? '#10B981' : alignment.alignmentScore >= 40 ? '#F59E0B' : '#EF4444'}
                                    strokeWidth="3"
                                    strokeDasharray={`${alignment.alignmentScore}, 100`}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-lg font-semibold">{alignment.alignmentScore}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-900">Engagement Score</p>
                            <div className="mt-2 flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    alignment.engagementScore >= 70 ? 'bg-green-500' :
                                    alignment.engagementScore >= 40 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${alignment.engagementScore}%` }}
                                />
                              </div>
                              <span className="ml-2 text-sm font-medium">{alignment.engagementScore}%</span>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-900">Giving Capacity</p>
                            <div className="mt-2 flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    alignment.givingCapacityScore >= 70 ? 'bg-green-500' :
                                    alignment.givingCapacityScore >= 40 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${alignment.givingCapacityScore}%` }}
                                />
                              </div>
                              <span className="ml-2 text-sm font-medium">{alignment.givingCapacityScore}%</span>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-900">Recency Score</p>
                            <div className="mt-2 flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    alignment.recencyScore >= 70 ? 'bg-green-500' :
                                    alignment.recencyScore >= 40 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${alignment.recencyScore}%` }}
                                />
                              </div>
                              <span className="ml-2 text-sm font-medium">{alignment.recencyScore}%</span>
                            </div>
                          </div>
                        </div>

                        {alignment.insights.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Key Insights</h4>
                            <ul className="space-y-2">
                              {alignment.insights.map((insight, index) => (
                                <li key={index} className="flex items-start">
                                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                                  <span className="text-sm text-gray-600">{insight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-medium text-gray-900">Matched Strategies</h4>
                            <span className="text-sm text-gray-500">
                              {alignment.matchedStrategies.length} strategy{alignment.matchedStrategies.length !== 1 ? 'ies' : ''}
                            </span>
                          </div>
                          {alignment.matchedStrategies.length > 0 ? (
                            <div className="space-y-3">
                              {alignment.matchedStrategies.map((s: FundraisingStrategy) => (
                                <div key={s.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                  <div>
                                    <span className="text-sm font-medium text-gray-900">{s.name}</span>
                                    <p className="text-xs text-gray-500">{s.description}</p>
                                  </div>
                                  <span className="text-sm font-medium text-blue-600">${s.impact?.toLocaleString() || 0}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No matched strategies found</p>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-sm font-medium text-gray-900">Total Potential Impact</span>
                              <p className="text-xs text-gray-500">Based on matched strategies</p>
                            </div>
                            <span className="text-lg font-semibold text-green-600">
                              ${alignment.potentialImpact.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 