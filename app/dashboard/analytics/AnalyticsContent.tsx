'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Event, Donor, Project } from '@/app/lib/types';
import { Card } from '@/components/ui/card';
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
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
  CalendarIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  HeartIcon,
  BuildingOfficeIcon,
  UserPlusIcon,
  ChartPieIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, subMonths, format } from 'date-fns';

interface AnalyticsData {
  events: Event[];
  donors: Donor[];
  projects: Project[];
  metrics: {
    totalVolunteers: number;
    totalHours: number;
    averageCapacity: number;
    activeEvents: number;
    totalBudget: number;
    totalRaised: number;
    overallROI: number;
    overallProgress: number;
    donorGrowth: number;
    averageDonation: number;
    donorRetention: number;
    donorLifetimeValue: number;
    eventSuccessRate: number;
    volunteerEngagement: number;
    fundraisingEfficiency: number;
  };
  trends: {
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    volunteerGrowth: Array<{ month: string; volunteers: number }>;
    eventParticipation: Array<{ month: string; participation: number }>;
  };
  eventTypes: Array<{ type: string; count: number }>;
  donorSegments: {
    amountSegments: Array<{ segment: string; count: number; value: number }>;
    frequencySegments: Array<{ segment: string; count: number; value: number }>;
    engagementSegments: Array<{ segment: string; count: number; value: number }>;
  };
}

export default function AnalyticsContent() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Fetch all relevant data
      const [eventsResponse, donorsResponse, projectsResponse] = await Promise.all([
        supabase.from('events').select('*').eq('user_id', user.id),
        supabase.from('donors').select('*').eq('user_id', user.id),
        supabase.from('projects').select('*').eq('user_id', user.id)
      ]);

      if (eventsResponse.error) throw eventsResponse.error;
      if (donorsResponse.error) throw donorsResponse.error;
      if (projectsResponse.error) throw projectsResponse.error;

      const events = eventsResponse.data || [];
      const donors = donorsResponse.data || [];
      const projects = projectsResponse.data || [];

      // Calculate metrics
      const metrics = calculateMetrics(events, donors, projects);
      const trends = calculateTrends(events, donors, timeRange);
      const eventTypes = calculateEventTypes(events);
      const donorSegments = calculateDonorSegments(donors);

      setData({
        events,
        donors,
        projects,
        metrics,
        trends,
        eventTypes,
        donorSegments
      });
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (events: Event[], donors: Donor[], projects: Project[]) => {
    // Volunteer metrics
    const totalVolunteers = events.reduce((sum, event) => sum + (event.volunteer_ids?.length || 0), 0);
    const totalHours = events.reduce((sum, event) => {
      if (!event.volunteer_hours) return sum;
      return sum + Object.values(event.volunteer_hours).reduce((hoursSum, hours) => hoursSum + hours, 0);
    }, 0);
    const averageCapacity = events.reduce((sum, event) => {
      if (!event.max_volunteers || !event.volunteer_ids) return sum;
      return sum + ((event.volunteer_ids.length / event.max_volunteers) * 100);
    }, 0) / events.length;

    // Financial metrics
    const totalBudget = events.reduce((sum, event) => sum + (event.budget || 0), 0);
    const totalRaised = events.reduce((sum, event) => sum + (event.amount_raised || 0), 0);
    const overallROI = totalBudget > 0 ? ((totalRaised - totalBudget) / totalBudget) * 100 : 0;
    const overallProgress = events.reduce((sum, event) => {
      const goal = event.fundraising_goal || 0;
      const raised = event.amount_raised || 0;
      return sum + (goal > 0 ? (raised / goal) * 100 : 0);
    }, 0) / events.length;

    // Donor metrics
    const donorGrowth = calculateDonorGrowth(donors);
    const averageDonation = calculateAverageDonation(donors);
    const donorRetention = calculateDonorRetention(donors);
    const donorLifetimeValue = calculateDonorLifetimeValue(donors);

    // Event metrics
    const eventSuccessRate = calculateEventSuccessRate(events);
    const volunteerEngagement = calculateVolunteerEngagement(events);
    const fundraisingEfficiency = calculateFundraisingEfficiency(events);

    return {
      totalVolunteers,
      totalHours,
      averageCapacity,
      activeEvents: events.filter(e => e.status === 'planned').length,
      totalBudget,
      totalRaised,
      overallROI,
      overallProgress,
      donorGrowth,
      averageDonation,
      donorRetention,
      donorLifetimeValue,
      eventSuccessRate,
      volunteerEngagement,
      fundraisingEfficiency
    };
  };

  const calculateTrends = (events: Event[], donors: Donor[], timeRange: 'week' | 'month' | 'year') => {
    const months = timeRange === 'week' ? 1 : timeRange === 'month' ? 6 : 12;
    const startDate = subMonths(new Date(), months);

    // Monthly revenue trend
    const monthlyRevenue = Array.from({ length: months }, (_, i) => {
      const month = subMonths(new Date(), i);
      const monthEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate.getMonth() === month.getMonth() && eventDate.getFullYear() === month.getFullYear();
      });
      return {
        month: format(month, 'MMM yyyy'),
        revenue: monthEvents.reduce((sum, event) => sum + (event.amount_raised || 0), 0)
      };
    }).reverse();

    // Volunteer growth trend
    const volunteerGrowth = Array.from({ length: months }, (_, i) => {
      const month = subMonths(new Date(), i);
      const monthEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate.getMonth() === month.getMonth() && eventDate.getFullYear() === month.getFullYear();
      });
      return {
        month: format(month, 'MMM yyyy'),
        volunteers: monthEvents.reduce((sum, event) => sum + (event.volunteer_ids?.length || 0), 0)
      };
    }).reverse();

    // Event participation trend
    const eventParticipation = Array.from({ length: months }, (_, i) => {
      const month = subMonths(new Date(), i);
      const monthEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate.getMonth() === month.getMonth() && eventDate.getFullYear() === month.getFullYear();
      });
      return {
        month: format(month, 'MMM yyyy'),
        participation: monthEvents.reduce((sum, event) => {
          const capacity = event.max_volunteers || 0;
          const volunteers = event.volunteer_ids?.length || 0;
          return sum + (capacity > 0 ? (volunteers / capacity) * 100 : 0);
        }, 0) / (monthEvents.length || 1)
      };
    }).reverse();

    return {
      monthlyRevenue,
      volunteerGrowth,
      eventParticipation
    };
  };

  const calculateEventTypes = (events: Event[]) => {
    const typeCounts = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count
    }));
  };

  const calculateDonorSegments = (donors: Donor[]) => {
    // Amount-based segments
    const amountSegments = donors.reduce((acc, donor) => {
      const amount = donor.total_given;
      if (amount >= 1000) acc.large++;
      else if (amount >= 500) acc.medium++;
      else acc.small++;
      return acc;
    }, { small: 0, medium: 0, large: 0 });

    // Frequency-based segments
    const frequencySegments = donors.reduce((acc, donor) => {
      if (!donor.last_gift_date) acc.oneTime++;
      else if (new Date(donor.last_gift_date) > subMonths(new Date(), 3)) acc.recent++;
      else if (new Date(donor.last_gift_date) > subMonths(new Date(), 12)) acc.regular++;
      else acc.lapsed++;
      return acc;
    }, { oneTime: 0, recent: 0, regular: 0, lapsed: 0 });

    // Engagement-based segments
    const engagementSegments = donors.reduce((acc, donor) => {
      const lastGiftDate = new Date(donor.last_gift_date);
      if (!donor.last_gift_date) acc.inactive++;
      else if (lastGiftDate > subMonths(new Date(), 1)) acc.highlyEngaged++;
      else if (lastGiftDate > subMonths(new Date(), 3)) acc.engaged++;
      else acc.lowEngagement++;
      return acc;
    }, { inactive: 0, lowEngagement: 0, engaged: 0, highlyEngaged: 0 });

    return {
      amountSegments: [
        { segment: 'Small Donors', count: amountSegments.small, value: amountSegments.small * 100 },
        { segment: 'Medium Donors', count: amountSegments.medium, value: amountSegments.medium * 500 },
        { segment: 'Large Donors', count: amountSegments.large, value: amountSegments.large * 1000 }
      ],
      frequencySegments: [
        { segment: 'One-Time', count: frequencySegments.oneTime, value: frequencySegments.oneTime * 100 },
        { segment: 'Recent', count: frequencySegments.recent, value: frequencySegments.recent * 200 },
        { segment: 'Regular', count: frequencySegments.regular, value: frequencySegments.regular * 300 },
        { segment: 'Lapsed', count: frequencySegments.lapsed, value: frequencySegments.lapsed * 50 }
      ],
      engagementSegments: [
        { segment: 'Inactive', count: engagementSegments.inactive, value: engagementSegments.inactive * 50 },
        { segment: 'Low Engagement', count: engagementSegments.lowEngagement, value: engagementSegments.lowEngagement * 100 },
        { segment: 'Engaged', count: engagementSegments.engaged, value: engagementSegments.engaged * 200 },
        { segment: 'Highly Engaged', count: engagementSegments.highlyEngaged, value: engagementSegments.highlyEngaged * 300 }
      ]
    };
  };

  const calculateDonorGrowth = (donors: Donor[]) => {
    if (donors.length === 0) return 0;
    const sortedDonors = [...donors].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const firstMonth = new Date(sortedDonors[0].created_at).getMonth();
    const lastMonth = new Date(sortedDonors[sortedDonors.length - 1].created_at).getMonth();
    const months = (lastMonth - firstMonth) + 1;
    return months > 0 ? (donors.length / months) * 12 : donors.length;
  };

  const calculateAverageDonation = (donors: Donor[]) => {
    const validDonations = donors.filter(donor => donor.last_gift_amount > 0);
    if (validDonations.length === 0) return 0;
    return validDonations.reduce((sum, donor) => sum + donor.last_gift_amount, 0) / validDonations.length;
  };

  const calculateDonorRetention = (donors: Donor[]) => {
    if (donors.length === 0) return 0;
    const repeatDonors = donors.filter(donor => {
      const lastGiftDate = new Date(donor.last_gift_date);
      const threeMonthsAgo = subMonths(new Date(), 3);
      return lastGiftDate > threeMonthsAgo;
    });
    return (repeatDonors.length / donors.length) * 100;
  };

  const calculateEventSuccessRate = (events: Event[]) => {
    if (events.length === 0) return 0;
    const successfulEvents = events.filter(event => {
      const goal = event.fundraising_goal || 0;
      const raised = event.amount_raised || 0;
      return raised >= goal;
    });
    return (successfulEvents.length / events.length) * 100;
  };

  const calculateVolunteerEngagement = (events: Event[]) => {
    if (events.length === 0) return 0;
    return events.reduce((sum, event) => {
      const capacity = event.max_volunteers || 0;
      const volunteers = event.volunteer_ids?.length || 0;
      return sum + (capacity > 0 ? (volunteers / capacity) * 100 : 0);
    }, 0) / events.length;
  };

  const calculateFundraisingEfficiency = (events: Event[]) => {
    if (events.length === 0) return 0;
    return events.reduce((sum, event) => {
      const budget = event.budget || 0;
      const raised = event.amount_raised || 0;
      return sum + (budget > 0 ? (raised / budget) : 0);
    }, 0) / events.length;
  };

  const calculateDonorLifetimeValue = (donors: Donor[]) => {
    if (donors.length === 0) return 0;
    
    const totalValue = donors.reduce((sum, donor) => {
      const yearsActive = donor.created_at ? 
        (new Date().getTime() - new Date(donor.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365) : 0;
      
      // Calculate annual value (total amount / years active, minimum 1 year)
      const annualValue = donor.total_given / Math.max(1, yearsActive);
      return sum + annualValue;
    }, 0);

    return totalValue / donors.length;
  };

  if (loading) {
    return null; // Let the Suspense fallback handle loading state
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error || 'No data available'}
        </div>
      </div>
    );
  }

  const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#f97316', '#059669'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500">Track event performance and impact metrics</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              timeRange === 'week'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              timeRange === 'month'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              timeRange === 'year'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-50 rounded-full">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Volunteers</p>
              <p className="text-2xl font-bold text-gray-900">{data.metrics.totalVolunteers}</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{data.metrics.donorGrowth.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(data.metrics.totalHours)}</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{data.metrics.volunteerEngagement.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-50 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Event Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(data.metrics.eventSuccessRate)}%</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{data.metrics.fundraisingEfficiency.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-yellow-50 rounded-full">
              <CalendarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Events</p>
              <p className="text-2xl font-bold text-gray-900">{data.metrics.activeEvents}</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{data.metrics.averageCapacity.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 rounded-full">
              <BanknotesIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">${data.metrics.totalBudget.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Raised</p>
              <p className="text-2xl font-bold text-gray-900">${data.metrics.totalRaised.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{data.metrics.overallROI.toFixed(1)}% ROI</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-rose-50 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Average Donation</p>
              <p className="text-2xl font-bold text-gray-900">${data.metrics.averageDonation.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{data.metrics.donorRetention.toFixed(1)}% retention</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-50 rounded-full">
              <ArrowTrendingUpIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Donor Lifetime Value</p>
              <p className="text-2xl font-bold text-gray-900">${data.metrics.donorLifetimeValue.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">per year</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends.monthlyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  labelStyle={{ color: '#374151' }}
                  itemStyle={{ color: '#6b7280' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8b5cf6" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Volunteer Growth */}
        <Card className="p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Volunteer Growth</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trends.volunteerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  labelStyle={{ color: '#374151' }}
                  itemStyle={{ color: '#6b7280' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="volunteers" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donor Amount Segments */}
        <Card className="p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Donor Amount Segments</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.donorSegments.amountSegments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="segment" 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  labelStyle={{ color: '#374151' }}
                  itemStyle={{ color: '#6b7280' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donor Frequency Segments */}
        <Card className="p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Donor Frequency Segments</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.donorSegments.frequencySegments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="segment" 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  labelStyle={{ color: '#374151' }}
                  itemStyle={{ color: '#6b7280' }}
                />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donor Engagement Segments */}
        <Card className="p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Donor Engagement Segments</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.donorSegments.engagementSegments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="segment" 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  labelStyle={{ color: '#374151' }}
                  itemStyle={{ color: '#6b7280' }}
                />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Event Performance Table */}
      <Card className="p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Event Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Event</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Volunteers</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Budget</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Raised</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ROI</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.events.map((event) => {
                const budget = event.budget ?? 0;
                const amountRaised = event.amount_raised ?? 0;
                const roi = budget > 0 ? ((amountRaised - budget) / budget) * 100 : 0;
                return (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{event.name}</div>
                      <div className="text-sm text-muted-foreground">{event.type}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {event.volunteer_ids?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      ${budget.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      ${amountRaised.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {Math.round(roi)}%
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={event.status === 'planned' ? 'default' : 'secondary'}>
                        {event.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
} 