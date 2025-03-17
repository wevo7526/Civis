'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { 
  CurrencyDollarIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
  CalendarIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardMetrics {
  totalDonors: number;
  totalRevenue: number;
  activeProjects: number;
  pendingGrants: number;
  upcomingEvents: number;
  donorRetentionRate: number;
}

interface RevenueData {
  month: string;
  revenue: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchUser();
    fetchMetrics();
    fetchRevenueData();
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: donors, error } = await supabase
        .from('donors')
        .select('created_at, amount')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group donations by month
      const monthlyData = donors.reduce((acc: any[], donor) => {
        const date = new Date(donor.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const existingMonth = acc.find(item => item.month === monthKey);
        if (existingMonth) {
          existingMonth.revenue += donor.amount;
        } else {
          acc.push({ month: monthKey, revenue: donor.amount });
        }
        return acc;
      }, []);

      setRevenueData(monthlyData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        throw new Error(`Authentication error: ${userError.message}`);
      }
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Fetch donors
      const { data: donors, error: donorsError } = await supabase
        .from('donors')
        .select('*')
        .eq('user_id', user.id);
      
      if (donorsError) {
        console.error('Donors fetch error:', donorsError);
        throw new Error(`Failed to fetch donors: ${donorsError.message}`);
      }

      // Fetch projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);
      
      if (projectsError) {
        console.error('Projects fetch error:', projectsError);
        throw new Error(`Failed to fetch projects: ${projectsError.message}`);
      }

      // Fetch writing items (grants)
      const { data: writingItems, error: writingItemsError } = await supabase
        .from('writing_items')
        .select('*')
        .eq('user_id', user.id);
      
      if (writingItemsError) {
        console.error('Writing items fetch error:', writingItemsError);
        throw new Error(`Failed to fetch writing items: ${writingItemsError.message}`);
      }

      // Fetch events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id);
      
      if (eventsError) {
        console.error('Events fetch error:', eventsError);
        throw new Error(`Failed to fetch events: ${eventsError.message}`);
      }

      // Calculate metrics with null checks
      const totalRevenue = (donors || []).reduce((sum, donor) => sum + (Number(donor.amount) || 0), 0);
      const activeProjects = (projects || []).filter(p => p.status === 'active').length;
      const pendingGrants = (writingItems || []).filter(w => w.status === 'draft').length;
      const upcomingEvents = (events || []).filter(e => new Date(e.date) > new Date()).length;

      // Calculate donor retention with null checks
      const returningDonors = (donors || []).filter(donor => {
        const donations = (donors || []).filter(d => d.email === donor.email);
        return donations.length > 1;
      });
      const donorRetentionRate = (donors || []).length > 0 ? (returningDonors.length / (donors || []).length) * 100 : 0;

      setMetrics({
        totalDonors: (donors || []).length,
        totalRevenue,
        activeProjects,
        pendingGrants,
        upcomingEvents,
        donorRetentionRate
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error fetching metrics:', {
        message: errorMessage,
        error: error,
        stack: error instanceof Error ? error.stack : undefined
      });
      setError(`Failed to load dashboard metrics: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-xl font-semibold text-purple-600">
              {user?.email?.[0].toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {user?.email}
            </h1>
            <p className="text-gray-500">Here's an overview of your nonprofit's performance</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Donors</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {metrics?.totalDonors || 0}
              </p>
              <div className="flex items-center mt-2">
                <span className={`text-sm ${(metrics?.donorRetentionRate ?? 0) >= 50 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {(metrics?.donorRetentionRate ?? 0).toFixed(1)}% retention
                </span>
                {(metrics?.donorRetentionRate ?? 0) >= 50 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 ml-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-yellow-600 ml-1" />
                )}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                ${metrics?.totalRevenue.toLocaleString() || 0}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-500">
                  {metrics?.activeProjects || 0} active projects
                </span>
                <CheckCircleIcon className="h-4 w-4 text-green-600 ml-1" />
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Grants</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {metrics?.pendingGrants || 0}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-500">
                  {metrics?.upcomingEvents || 0} upcoming events
                </span>
                <CalendarIcon className="h-4 w-4 text-blue-600 ml-1" />
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Engagement Score</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {metrics?.donorRetentionRate.toFixed(1)}%
              </p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-500">
                  Last 30 days
                </span>
                <ClockIcon className="h-4 w-4 text-purple-600 ml-1" />
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-50 flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions and AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <button
              onClick={() => router.push('/dashboard/writing')}
              className="w-full flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Write New Grant</span>
              </div>
              <span className="text-sm text-gray-500">→</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/donors')}
              className="w-full flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center">
                <UserGroupIcon className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Manage Donors</span>
              </div>
              <span className="text-sm text-gray-500">→</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/projects')}
              className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">View Projects</span>
              </div>
              <span className="text-sm text-gray-500">→</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4">AI Insights</h2>
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center mb-2">
                <SparklesIcon className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="text-sm font-medium text-purple-900">Grant Writing Tips</h3>
              </div>
              <p className="text-sm text-purple-700">
                Consider highlighting your organization's impact metrics in your next grant proposal to increase funding chances.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center mb-2">
                <SparklesIcon className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="text-sm font-medium text-green-900">Donor Engagement</h3>
              </div>
              <p className="text-sm text-green-700">
                Your donor retention rate suggests an opportunity to strengthen donor relationships through personalized communication.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center mb-2">
                <SparklesIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-sm font-medium text-blue-900">Project Impact</h3>
              </div>
              <p className="text-sm text-blue-700">
                Your active projects are showing strong progress. Consider sharing these successes in your next donor update.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={(value: string) => {
                  const [year, month] = value.split('-');
                  return `${month}/${year.slice(2)}`;
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                labelFormatter={(label: string) => {
                  const [year, month] = label.split('-');
                  return `${month}/${year}`;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 