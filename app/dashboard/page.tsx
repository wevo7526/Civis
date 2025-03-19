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
      href: '/dashboard/events',
      icon: CalendarIcon,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      name: 'Launch Campaign',
      description: 'Start a new fundraising campaign',
      href: '/dashboard/campaigns',
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
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.email}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className="group relative bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className={`h-12 w-12 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                <action.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                  {action.name}
                </h3>
                <p className="text-sm text-gray-500">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Metrics and Chart */}
        <div className="lg:col-span-8 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-50 flex items-center justify-center">
                    <UserGroupIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Donors</p>
                    <p className="text-2xl font-semibold text-gray-900">{metrics?.totalDonors || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${metrics?.totalRevenue?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FolderIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Projects</p>
                    <p className="text-2xl font-semibold text-gray-900">{metrics?.activeProjects || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-yellow-50 flex items-center justify-center">
                    <CalendarIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Upcoming Events</p>
                    <p className="text-2xl font-semibold text-gray-900">{metrics?.upcomingEvents || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b-0">
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
                    <XAxis dataKey="month" className="text-sm text-gray-500" />
                    <YAxis className="text-sm text-gray-500" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none', 
                        borderRadius: '0.5rem',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Recent Activity and Donor Retention */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b-0">
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      {activity.type === 'donation' && <HeartIcon className="h-4 w-4 text-purple-700" />}
                      {activity.type === 'event' && <CalendarIcon className="h-4 w-4 text-purple-700" />}
                      {activity.type === 'campaign' && <MegaphoneIcon className="h-4 w-4 text-purple-700" />}
                      {activity.type === 'donor' && <UserIcon className="h-4 w-4 text-purple-700" />}
                      {activity.type === 'project' && <FolderIcon className="h-4 w-4 text-purple-700" />}
                      {activity.type === 'report' && <DocumentTextIcon className="h-4 w-4 text-purple-700" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Donor Retention */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b-0">
              <CardTitle>Donor Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {(metrics?.donorRetentionRate ?? 0).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Retention Rate</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {(metrics?.donorRetentionRate ?? 0) >= 70 ? 'Excellent' : (metrics?.donorRetentionRate ?? 0) >= 50 ? 'Good' : 'Needs Improvement'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 