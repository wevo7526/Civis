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
  totalPrograms: number;
  activeVolunteers: number;
  upcomingEvents: number;
  totalGrants: number;
  totalImpact: number;
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

      // Get the last 6 months
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);

      const { data: donors, error } = await supabase
        .from('donors')
        .select('created_at, amount')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Generate last 6 months array
      const months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          revenue: 0
        };
      }).reverse();

      // Fill in actual revenue data
      donors?.forEach(donor => {
        const date = new Date(donor.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthData = months.find(m => m.month === monthKey);
        if (monthData) {
          monthData.revenue += Number(donor.amount) || 0;
        }
      });

      setRevenueData(months);
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

      // Fetch various organizational data
      const [programs, volunteers, events, grants] = await Promise.all([
        supabase.from('programs').select('*').eq('user_id', user.id),
        supabase.from('volunteers').select('*').eq('user_id', user.id),
        supabase.from('events').select('*').eq('user_id', user.id),
        supabase.from('grants').select('*').eq('user_id', user.id)
      ]);

      // Calculate metrics
      const activeVolunteers = volunteers.data?.filter(v => v.status === 'active').length || 0;
      const upcomingEvents = events.data?.filter(e => new Date(e.date) > new Date()).length || 0;
      const totalGrants = grants.data?.length || 0;
      const totalImpact = programs.data?.reduce((sum, program) => sum + (program.impact_score || 0), 0) || 0;

      setMetrics({
        totalPrograms: programs.data?.length || 0,
        activeVolunteers,
        upcomingEvents,
        totalGrants,
        totalImpact
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError('Failed to load dashboard metrics');
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

  const getActivityIcon = (type: string) => {
    // Donor activities
    if (type.startsWith('donor_')) {
      return <UserIcon className="h-4 w-4 text-purple-700" />;
    }
    // Event activities
    if (type.startsWith('event_')) {
      return <CalendarIcon className="h-4 w-4 text-blue-700" />;
    }
    // Campaign activities
    if (type.startsWith('campaign_')) {
      return <MegaphoneIcon className="h-4 w-4 text-green-700" />;
    }
    // Email campaign activities
    if (type.startsWith('email_')) {
      return <EnvelopeIcon className="h-4 w-4 text-indigo-700" />;
    }
    // Document activities
    if (type.startsWith('document_')) {
      return <DocumentIcon className="h-4 w-4 text-orange-700" />;
    }
    // Workflow activities
    if (type.startsWith('workflow_')) {
      return <SparklesIcon className="h-4 w-4 text-pink-700" />;
    }
    // Grant activities
    if (type.startsWith('grant_')) {
      return <CurrencyDollarIcon className="h-4 w-4 text-yellow-700" />;
    }
    // Impact report activities
    if (type === 'impact_report') {
      return <ChartBarIcon className="h-4 w-4 text-teal-700" />;
    }
    // Default icon
    return <BellIcon className="h-4 w-4 text-gray-700" />;
  };

  const getActivityColor = (type: string) => {
    // Donor activities
    if (type.startsWith('donor_')) {
      return 'bg-purple-100';
    }
    // Event activities
    if (type.startsWith('event_')) {
      return 'bg-blue-100';
    }
    // Campaign activities
    if (type.startsWith('campaign_')) {
      return 'bg-green-100';
    }
    // Email campaign activities
    if (type.startsWith('email_')) {
      return 'bg-indigo-100';
    }
    // Document activities
    if (type.startsWith('document_')) {
      return 'bg-orange-100';
    }
    // Workflow activities
    if (type.startsWith('workflow_')) {
      return 'bg-pink-100';
    }
    // Grant activities
    if (type.startsWith('grant_')) {
      return 'bg-yellow-100';
    }
    // Impact report activities
    if (type === 'impact_report') {
      return 'bg-teal-100';
    }
    // Default color
    return 'bg-gray-100';
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
      description: 'Start a new email campaign',
      href: '/dashboard/outreach',
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
            className="group relative bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-0"
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

      {/* Separator */}
      <div className="border-t border-gray-200 my-6"></div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Metrics and Chart */}
        <div className="lg:col-span-8 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-50 rounded-full">
                  <FolderIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Programs</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.totalPrograms || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-50 rounded-full">
                  <UserGroupIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Volunteers</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.activeVolunteers || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-50 rounded-full">
                  <CalendarIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Upcoming Events</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.upcomingEvents || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-50 rounded-full">
                  <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Grants</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.totalGrants || 0}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Impact Overview */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="border-b-0">
              <CardTitle>Organizational Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
                    <XAxis 
                      dataKey="month" 
                      className="text-sm text-gray-500"
                      tickFormatter={(value) => {
                        const [year, month] = value.split('-');
                        const date = new Date(parseInt(year), parseInt(month) - 1);
                        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                      }}
                      interval={0}
                    />
                    <YAxis 
                      className="text-sm text-gray-500"
                      tickFormatter={(value) => `${value}%`}
                      width={80}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none', 
                        borderRadius: '0.5rem',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value: number) => [`${value}%`, 'Impact Score']}
                      labelFormatter={(label) => {
                        const [year, month] = label.split('-');
                        const date = new Date(parseInt(year), parseInt(month) - 1);
                        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - New Dashboard Elements */}
        <div className="lg:col-span-4 space-y-6">
          {/* Email Campaign Performance */}
          <Card className="p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Email Campaign Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Open Rate</span>
                <span className="text-sm font-medium text-gray-900">42.5%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: '42.5%' }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Click Rate</span>
                <span className="text-sm font-medium text-gray-900">18.2%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 bg-green-500 rounded-full" style={{ width: '18.2%' }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Unsubscribe Rate</span>
                <span className="text-sm font-medium text-gray-900">1.8%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 bg-red-500 rounded-full" style={{ width: '1.8%' }}></div>
              </div>
            </div>
          </Card>

          {/* Fundraising Strategy Insights */}
          <Card className="p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Strategy Insights</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Major Donor Program</p>
                  <p className="text-xs text-gray-500">Identify and cultivate top 10% of donors</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Monthly Giving</p>
                  <p className="text-xs text-gray-500">Convert 20% of one-time donors</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Peer-to-Peer</p>
                  <p className="text-xs text-gray-500">Launch ambassador program</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Platform Health Score */}
          <Card className="p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Platform Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Data Completeness</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-teal-500 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">85%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Engagement Rate</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-teal-500 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">72%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Automation Health</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-teal-500 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">92%</span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Overall Score</span>
                  <span className="text-lg font-semibold text-teal-600">83%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 