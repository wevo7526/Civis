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
  CheckCircleIcon,
  EnvelopeIcon,
  BellIcon,
  HeartIcon,
  FolderIcon,
  Cog6ToothIcon,
  MegaphoneIcon,
  UserIcon,
  BuildingOfficeIcon,
  UserPlusIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserCircle, Calendar, Megaphone, Cog, Bell, ChartBar } from 'lucide-react';

interface DashboardMetrics {
  totalDonors: number;
  totalRevenue: number;
  activeProjects: number;
  upcomingEvents: number;
  donorRetentionRate: number;
}

interface RevenueData {
  month: string;
  revenue: number;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  metadata: any;
  created_at: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchUser();
    fetchMetrics();
    fetchRevenueData();
    fetchActivities();
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

  const fetchActivities = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication error');
      }

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  const quickActions = [
    {
      name: 'Add Donor',
      description: 'Add a new donor to your database',
      href: '/dashboard/donors',
      icon: UserPlusIcon,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      name: 'Create Event',
      description: 'Set up a new fundraising event',
      href: '/dashboard/events/new',
      icon: CalendarIcon,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      name: 'Launch Campaign',
      description: 'Start a new fundraising campaign',
      href: '/dashboard/campaigns/new',
      icon: MegaphoneIcon,
      color: 'bg-green-50 text-green-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.email}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{action.name}</h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {activity.type.startsWith('donor_') && (
                    <UserCircle className="h-6 w-6 text-blue-500" />
                  )}
                  {activity.type.startsWith('event_') && (
                    <Calendar className="h-6 w-6 text-green-500" />
                  )}
                  {activity.type.startsWith('campaign_') && (
                    <Megaphone className="h-6 w-6 text-purple-500" />
                  )}
                  {activity.type.startsWith('workflow_') && (
                    <Cog className="h-6 w-6 text-orange-500" />
                  )}
                  {activity.type.startsWith('document_') && (
                    <DocumentIcon className="h-6 w-6 text-gray-500" />
                  )}
                  {activity.type === 'grant_reminder' && (
                    <Bell className="h-6 w-6 text-yellow-500" />
                  )}
                  {activity.type === 'impact_report' && (
                    <ChartBar className="h-6 w-6 text-red-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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
              <p className="text-sm font-medium text-gray-500">Active Projects</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {metrics?.activeProjects || 0}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-500">
                  {metrics?.upcomingEvents || 0} upcoming events
                </span>
                <CalendarIcon className="h-4 w-4 text-blue-600 ml-1" />
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <FolderIcon className="h-6 w-6 text-blue-600" />
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
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center mb-2">
                <SparklesIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <h3 className="text-sm font-medium text-yellow-900">Volunteer Management</h3>
              </div>
              <p className="text-sm text-yellow-700">
                Your volunteer engagement is below target. Consider implementing a volunteer recognition program to boost participation.
              </p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <div className="flex items-center mb-2">
                <SparklesIcon className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-sm font-medium text-indigo-900">Event Planning</h3>
              </div>
              <p className="text-sm text-indigo-700">
                Upcoming events need more promotion. Consider leveraging social media and email campaigns to increase attendance.
              </p>
            </div>
          </div>
        </div>

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
    </div>
  );
} 