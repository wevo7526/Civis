'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Event, Donor, Project } from '@/app/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
    donorRetentionRate: number;
    donorAcquisitionCost: number;
    lifetimeDonorValue: number;
    onlineGivingPercentage: number;
    recurringGiftPercentage: number;
    lapsedDonorRate: number;
    reactivationRate: number;
    donorSegments: {
      amountSegments: Array<{ name: string; value: number; count: number }>;
      frequencySegments: Array<{ name: string; value: number; count: number }>;
      engagementSegments: Array<{ name: string; value: number; count: number }>;
    };
    donorEngagement: {
      high: number;
      medium: number;
      low: number;
    };
    donorFrequency: {
      monthly: number;
      quarterly: number;
      annual: number;
    };
  };
  trends: {
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    volunteerGrowth: Array<{ month: string; volunteers: number }>;
    eventParticipation: Array<{ month: string; participation: number }>;
    donorAcquisition: Array<{ month: string; newDonors: number; totalDonors: number }>;
  };
  eventTypes: Array<{ type: string; count: number }>;
  donorSegments: {
    amountSegments: Array<{ name: string; value: number; count: number }>;
    frequencySegments: Array<{ name: string; value: number; count: number }>;
    engagementSegments: Array<{ name: string; value: number; count: number }>;
  };
}

interface AnalyticsMetrics {
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
  donorRetentionRate: number;
  donorAcquisitionCost: number;
  lifetimeDonorValue: number;
  onlineGivingPercentage: number;
  recurringGiftPercentage: number;
  lapsedDonorRate: number;
  reactivationRate: number;
  donorSegments: {
    amountSegments: Array<{ name: string; value: number; count: number }>;
    frequencySegments: Array<{ name: string; value: number; count: number }>;
    engagementSegments: Array<{ name: string; value: number; count: number }>;
  };
  donorEngagement: {
    high: number;
    medium: number;
    low: number;
  };
  donorFrequency: {
    monthly: number;
    quarterly: number;
    annual: number;
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

    // New metrics
    const donorRetentionRate = calculateDonorRetentionRate(donors);
    const donorAcquisitionCost = calculateDonorAcquisitionCost(donors);
    const lifetimeDonorValue = calculateLifetimeDonorValue(donors);
    const onlineGivingPercentage = calculateOnlineGivingPercentage(donors);
    const recurringGiftPercentage = calculateRecurringGiftPercentage(donors);
    const lapsedDonorRate = calculateLapsedDonorRate(donors);
    const reactivationRate = calculateReactivationRate(donors);
    const donorSegments = calculateDonorSegments(donors);
    const donorEngagement = calculateDonorEngagement(donors);
    const donorFrequency = calculateDonorFrequency(donors);

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
      fundraisingEfficiency,
      donorRetentionRate,
      donorAcquisitionCost,
      lifetimeDonorValue,
      onlineGivingPercentage,
      recurringGiftPercentage,
      lapsedDonorRate,
      reactivationRate,
      donorSegments,
      donorEngagement,
      donorFrequency
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

    // Donor acquisition trend
    const donorAcquisition = Array.from({ length: months }, (_, i) => {
      const month = subMonths(new Date(), i);
      const monthDonors = donors.filter(donor => {
        const donorDate = new Date(donor.created_at);
        return donorDate.getMonth() === month.getMonth() && donorDate.getFullYear() === month.getFullYear();
      });
      return {
        month: format(month, 'MMM yyyy'),
        newDonors: monthDonors.length,
        totalDonors: donors.filter(donor => 
          new Date(donor.created_at) <= month
        ).length
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
      donorAcquisition,
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

    // Amount-based segments
    const major = donors.filter(donor => donor.total_given >= 10000).length;
    const mid = donors.filter(donor => donor.total_given >= 1000 && donor.total_given < 10000).length;
    const small = donors.filter(donor => donor.total_given < 1000).length;

    // Frequency-based segments
    const monthly = donors.filter(donor => donor.frequency === 'monthly').length;
    const quarterly = donors.filter(donor => donor.frequency === 'quarterly').length;
    const annual = donors.filter(donor => donor.frequency === 'annual').length;
    const oneTime = donors.filter(donor => donor.frequency === 'one-time').length;

    // Engagement-based segments
    const high = donors.filter(donor => {
      const interactions = donor.interaction_count || 0;
      return interactions >= 5;
    }).length;
    
    const medium = donors.filter(donor => {
      const interactions = donor.interaction_count || 0;
      return interactions >= 2 && interactions < 5;
    }).length;
    
    const low = donors.filter(donor => {
      const interactions = donor.interaction_count || 0;
      return interactions < 2;
    }).length;

    return {
      amountSegments: [
        { name: 'Major ($10k+)', value: major, count: major },
        { name: 'Mid-Level ($1k-$10k)', value: mid, count: mid },
        { name: 'Small (under $1k)', value: small, count: small }
      ].filter(segment => segment.value > 0),
      frequencySegments: [
        { name: 'Monthly', value: monthly, count: monthly },
        { name: 'Quarterly', value: quarterly, count: quarterly },
        { name: 'Annual', value: annual, count: annual },
        { name: 'One-time', value: oneTime, count: oneTime }
      ].filter(segment => segment.value > 0),
      engagementSegments: [
        { name: 'High Engagement', value: high, count: high },
        { name: 'Medium Engagement', value: medium, count: medium },
        { name: 'Low Engagement', value: low, count: low }
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
    const validDonations = donors.filter(donor => donor.total_given > 0);
    const totalAmount = validDonations.reduce((sum, donor) => sum + donor.total_given, 0);
    if (validDonations.length === 0) return 0;
    
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

  const calculateDonorRetentionRate = (donors: Donor[]) => {
    if (donors.length === 0) return 0;
    
    // Consider a donor retained if they have given more than once
    const repeatDonors = donors.filter(donor => {
      const donations = donors.filter(d => d.email === donor.email);
      return donations.length > 1;
    });
    
    return (repeatDonors.length / donors.length) * 100;
  };

  const calculateDonorAcquisitionCost = (donors: Donor[]) => {
    // Simplified for example
    return 5000 / donors.length;
  };

  const calculateLifetimeDonorValue = (donors: Donor[]) => {
    if (donors.length === 0) return 0;
    
    const totalRevenue = donors.reduce((sum, donor) => {
      const amount = typeof donor.total_given === 'string' ? parseFloat(donor.total_given) : donor.total_given;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    return totalRevenue / donors.length;
  };

  const calculateOnlineGivingPercentage = (donors: Donor[]) => {
    if (donors.length === 0) return 0;
    
    const onlineDonations = donors.filter(donor => donor.payment_method === 'online').length;
    return (onlineDonations / donors.length) * 100;
  };

  const calculateRecurringGiftPercentage = (donors: Donor[]) => {
    if (donors.length === 0) return 0;
    
    const recurringDonors = donors.filter(donor => donor.recurring === true).length;
    return (recurringDonors / donors.length) * 100;
  };

  const calculateLapsedDonorRate = (donors: Donor[]) => {
    if (donors.length === 0) return 0;
    
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const lapsedDonors = donors.filter(donor => {
      const lastDonation = new Date(donor.last_donation_date || donor.created_at);
      return lastDonation < twelveMonthsAgo;
    });
    
    return (lapsedDonors.length / donors.length) * 100;
  };

  const calculateReactivationRate = (donors: Donor[]) => {
    if (donors.length === 0) return 0;
    
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const lapsedDonors = donors.filter(donor => {
      const lastDonation = new Date(donor.last_donation_date || donor.created_at);
      return lastDonation < twelveMonthsAgo;
    });
    
    const reactivatedDonors = lapsedDonors.filter(donor => {
      const lastDonation = new Date(donor.last_donation_date || donor.created_at);
      return lastDonation > twelveMonthsAgo;
    });
    
    return (reactivatedDonors.length / lapsedDonors.length) * 100;
  };

  const calculateDonorEngagement = (donors: Donor[]) => {
    if (donors.length === 0) return { high: 0, medium: 0, low: 0 };
    
    return {
      high: donors.filter(donor => donor.interaction_count >= 5).length,
      medium: donors.filter(donor => donor.interaction_count >= 2 && donor.interaction_count < 5).length,
      low: donors.filter(donor => donor.interaction_count < 2).length
    };
  };

  const calculateDonorFrequency = (donors: Donor[]) => {
    if (donors.length === 0) return { monthly: 0, quarterly: 0, annual: 0 };
    
    return {
      monthly: donors.filter(donor => donor.frequency === 'monthly').length,
      quarterly: donors.filter(donor => donor.frequency === 'quarterly').length,
      annual: donors.filter(donor => donor.frequency === 'annual').length
    };
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

      {/* Key Donor Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-50 rounded-full">
              <HeartIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Donor Retention Rate</p>
              <p className="text-2xl font-bold text-gray-900">{data.metrics.donorRetentionRate.toFixed(1)}%</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">Target: 60%</span>
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
              <p className="text-sm font-medium text-gray-500">Average Gift Size</p>
              <p className="text-2xl font-bold text-gray-900">${data.metrics.averageDonation.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{data.metrics.donorGrowth.toFixed(1)}% Growth</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Lifetime Donor Value</p>
              <p className="text-2xl font-bold text-gray-900">${data.metrics.lifetimeDonorValue.toLocaleString()}</p>
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
              <UserGroupIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Recurring Gift %</p>
              <p className="text-2xl font-bold text-gray-900">{data.metrics.recurringGiftPercentage.toFixed(1)}%</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{data.metrics.onlineGivingPercentage.toFixed(1)}% Online</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Donor Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donor Retention & Acquisition */}
        <Card className="p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Donor Retention & Acquisition</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Donor Retention Rate</span>
                <span className="text-sm font-medium text-gray-900">{data.metrics.donorRetentionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="h-2 bg-purple-500 rounded-full"
                  style={{ width: `${data.metrics.donorRetentionRate}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Donor Acquisition Cost</span>
                <span className="text-sm font-medium text-gray-900">${data.metrics.donorAcquisitionCost.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="h-2 bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(100, (data.metrics.donorAcquisitionCost / 100) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Lapsed Donor Rate</span>
                <span className="text-sm font-medium text-gray-900">{data.metrics.lapsedDonorRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="h-2 bg-red-500 rounded-full"
                  style={{ width: `${data.metrics.lapsedDonorRate}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Reactivation Rate</span>
                <span className="text-sm font-medium text-gray-900">{data.metrics.reactivationRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: `${data.metrics.reactivationRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Donor Giving Trends */}
        <Card className="p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Donor Giving Trends</h3>
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
      </div>

      {/* Donor Segments */}
      <Card className="p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Donor Segments</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Total Donors: {data.donors.length}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Amount Segments */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">By Donation Amount</h4>
            <div className="space-y-4">
              {data.donorSegments.amountSegments.map((segment, index) => (
                <div key={segment.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{segment.name}</span>
                    <span className="text-sm font-medium text-gray-900">{segment.count} donors</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(segment.count / data.donors.length) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Segments */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">By Engagement Level</h4>
            <div className="space-y-4">
              {data.donorSegments.engagementSegments.map((segment, index) => (
                <div key={segment.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{segment.name}</span>
                    <span className="text-sm font-medium text-gray-900">{segment.count} donors</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(segment.count / data.donors.length) * 100}%`,
                        backgroundColor: COLORS[(index + 3) % COLORS.length]
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Frequency Segments */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">By Giving Frequency</h4>
            <div className="space-y-4">
              {data.donorSegments.frequencySegments.map((segment, index) => (
                <div key={segment.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{segment.name}</span>
                    <span className="text-sm font-medium text-gray-900">{segment.count} donors</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(segment.count / data.donors.length) * 100}%`,
                        backgroundColor: COLORS[(index + 6) % COLORS.length]
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 