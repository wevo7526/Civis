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
    amountSegments: Array<{ name: string; value: number; count: number }>;
    frequencySegments: Array<{ name: string; value: number; count: number }>;
    engagementSegments: Array<{ name: string; value: number; count: number }>;
  };
}

export default function AnalyticsContent() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'donors' | 'engagement'>('revenue');
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
    if (!donors || donors.length === 0) {
      return {
        amountSegments: [
          { name: 'No Donors', value: 0, count: 0 }
        ],
        frequencySegments: [
          { name: 'No Donors', value: 0, count: 0 }
        ],
        engagementSegments: [
          { name: 'No Donors', value: 0, count: 0 }
        ]
      };
    }

    // Amount-based segments with more meaningful tiers
    const amountSegments = donors.reduce((acc, donor) => {
      const amount = donor.total_given || 0;
      if (amount >= 5000) acc.major++;
      else if (amount >= 1000) acc.large++;
      else if (amount >= 500) acc.medium++;
      else if (amount >= 100) acc.small++;
      else acc.micro++;
      return acc;
    }, { micro: 0, small: 0, medium: 0, large: 0, major: 0 });

    // Frequency-based segments with better categorization
    const frequencySegments = donors.reduce((acc, donor) => {
      if (!donor.last_gift_date) acc.oneTime++;
      else {
        const lastGiftDate = new Date(donor.last_gift_date);
        const now = new Date();
        const monthsSinceLastGift = (now.getFullYear() - lastGiftDate.getFullYear()) * 12 + 
                                   (now.getMonth() - lastGiftDate.getMonth());
        
        if (monthsSinceLastGift <= 3) acc.recent++;
        else if (monthsSinceLastGift <= 6) acc.quarterly++;
        else if (monthsSinceLastGift <= 12) acc.annual++;
        else acc.lapsed++;
      }
      return acc;
    }, { oneTime: 0, recent: 0, quarterly: 0, annual: 0, lapsed: 0 });

    // Engagement-based segments with more nuanced categories
    const engagementSegments = donors.reduce((acc, donor) => {
      const lastGiftDate = donor.last_gift_date ? new Date(donor.last_gift_date) : null;
      const totalGiven = donor.total_given || 0;
      
      // Check if this is a repeat donor by looking for other donations from the same email
      const isRepeatDonor = donors.filter(d => d.email === donor.email).length > 1;

      if (!lastGiftDate) {
        acc.inactive++;
      } else {
        const now = new Date();
        const monthsSinceLastGift = (now.getFullYear() - lastGiftDate.getFullYear()) * 12 + 
                                   (now.getMonth() - lastGiftDate.getMonth());
        
        if (monthsSinceLastGift <= 1 && isRepeatDonor) acc.champions++;
        else if (monthsSinceLastGift <= 3 && isRepeatDonor) acc.engaged++;
        else if (monthsSinceLastGift <= 6) acc.regular++;
        else if (monthsSinceLastGift <= 12) acc.occasional++;
        else acc.atRisk++;
      }
      return acc;
    }, { inactive: 0, atRisk: 0, occasional: 0, regular: 0, engaged: 0, champions: 0 });

    // Convert to array format and ensure all values are numbers
    return {
      amountSegments: [
        { name: 'Major ($5k+)', value: Number(amountSegments.major), count: Number(amountSegments.major) },
        { name: 'Large ($1k-$5k)', value: Number(amountSegments.large), count: Number(amountSegments.large) },
        { name: 'Medium ($500-$1k)', value: Number(amountSegments.medium), count: Number(amountSegments.medium) },
        { name: 'Small ($100-$500)', value: Number(amountSegments.small), count: Number(amountSegments.small) },
        { name: 'Micro (<$100)', value: Number(amountSegments.micro), count: Number(amountSegments.micro) }
      ].filter(segment => segment.value > 0),
      frequencySegments: [
        { name: 'Recent (≤3m)', value: Number(frequencySegments.recent), count: Number(frequencySegments.recent) },
        { name: 'Quarterly (3-6m)', value: Number(frequencySegments.quarterly), count: Number(frequencySegments.quarterly) },
        { name: 'Annual (6-12m)', value: Number(frequencySegments.annual), count: Number(frequencySegments.annual) },
        { name: 'Lapsed (>12m)', value: Number(frequencySegments.lapsed), count: Number(frequencySegments.lapsed) },
        { name: 'One-Time', value: Number(frequencySegments.oneTime), count: Number(frequencySegments.oneTime) }
      ].filter(segment => segment.value > 0),
      engagementSegments: [
        { name: 'Champions', value: Number(engagementSegments.champions), count: Number(engagementSegments.champions) },
        { name: 'Engaged', value: Number(engagementSegments.engaged), count: Number(engagementSegments.engaged) },
        { name: 'Regular', value: Number(engagementSegments.regular), count: Number(engagementSegments.regular) },
        { name: 'Occasional', value: Number(engagementSegments.occasional), count: Number(engagementSegments.occasional) },
        { name: 'At Risk', value: Number(engagementSegments.atRisk), count: Number(engagementSegments.atRisk) },
        { name: 'Inactive', value: Number(engagementSegments.inactive), count: Number(engagementSegments.inactive) }
      ].filter(segment => segment.value > 0)
    };
  };

  const calculateDonorGrowth = (donors: Donor[]) => {
    if (donors.length === 0) return 0;
    
    // Get the date range
    const sortedDonors = [...donors].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const firstDate = new Date(sortedDonors[0].created_at);
    const lastDate = new Date(sortedDonors[sortedDonors.length - 1].created_at);
    
    // Calculate months difference
    const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                      (lastDate.getMonth() - firstDate.getMonth()) + 1;
    
    // Calculate growth rate
    const growthRate = monthsDiff > 0 ? 
      ((donors.length / monthsDiff) * 12) / Math.max(1, donors.length - 1) * 100 : 0;
    
    return growthRate;
  };

  const calculateAverageDonation = (donors: Donor[]) => {
    const validDonations = donors.filter(donor => (donor.last_gift_amount ?? 0) > 0);
    if (validDonations.length === 0) return 0;
    
    const totalAmount = validDonations.reduce((sum, donor) => sum + (donor.last_gift_amount ?? 0), 0);
    return totalAmount / validDonations.length;
  };

  const calculateDonorRetention = (donors: Donor[]) => {
    if (donors.length === 0) return 0;
    
    // Consider a donor retained if they have given more than once
    const repeatDonors = donors.filter(donor => {
      const donations = donors.filter(d => d.email === donor.email);
      return donations.length > 1;
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
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

  const COLORS = [
    '#8b5cf6', // Purple
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#f97316', // Orange
    '#059669', // Emerald
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#ec4899', // Pink
    '#6366f1', // Indigo
    '#14b8a6'  // Teal
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === 'week'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === 'month'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === 'year'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-50 rounded-full">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Donors</p>
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
            <div className="p-3 bg-green-50 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
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
            <div className="p-3 bg-blue-50 rounded-full">
              <HeartIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Donor Retention</p>
              <p className="text-2xl font-bold text-gray-900">{data.metrics.donorRetention.toFixed(1)}%</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{data.metrics.donorLifetimeValue.toFixed(1)}% LTV</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-yellow-50 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Donation</p>
              <p className="text-2xl font-bold text-gray-900">${data.metrics.averageDonation.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{data.metrics.fundraisingEfficiency.toFixed(1)}% Efficiency</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedMetric('revenue')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'revenue'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setSelectedMetric('donors')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'donors'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Donors
              </button>
              <button
                onClick={() => setSelectedMetric('engagement')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'engagement'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Engagement
              </button>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trends.monthlyRevenue}>
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
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
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
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Area 
                  dataKey="revenue" 
                  fill="#8b5cf6" 
                  fillOpacity={0.1}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donor Segments */}
        <Card className="p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Donor Segments</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.donorSegments.amountSegments}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={true}
                  paddingAngle={2}
                >
                  {data.donorSegments.amountSegments.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  labelStyle={{ color: '#374151' }}
                  itemStyle={{ color: '#6b7280' }}
                  formatter={(value: number) => [`${value} donors`, 'Count']}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => value}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donor Engagement */}
        <Card className="p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Donor Engagement</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.donorSegments.engagementSegments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `${value}`}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
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
                  formatter={(value: number) => [`${value} donors`, 'Count']}
                />
                <Bar 
                  dataKey="value" 
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donor Frequency */}
        <Card className="p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Donor Frequency</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.donorSegments.frequencySegments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `${value}`}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
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
                  formatter={(value: number) => [`${value} donors`, 'Count']}
                />
                <Bar 
                  dataKey="value" 
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
} 