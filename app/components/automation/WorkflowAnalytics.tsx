import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface WorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  successRate: number;
  totalExecutions: number;
  recentExecutions: {
    date: string;
    success: number;
    failed: number;
  }[];
  topPerformingWorkflows: {
    id: string;
    name: string;
    successRate: number;
    totalRuns: number;
  }[];
  errorRate: number;
}

export function WorkflowAnalytics() {
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchWorkflowStats();
  }, []);

  const fetchWorkflowStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch workflow data
      const { data: workflows, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Calculate statistics
      const totalWorkflows = workflows.length;
      const activeWorkflows = workflows.filter(w => w.status === 'active').length;
      const totalExecutions = workflows.reduce((sum, w) => sum + (w.stats?.totalRuns || 0), 0);
      const successRate = workflows.reduce((sum, w) => sum + (w.stats?.successRate || 0), 0) / totalWorkflows;
      const errorRate = 100 - successRate;

      // Get recent executions
      const recentExecutions = await getRecentExecutions(user.id);

      // Get top performing workflows
      const topPerformingWorkflows = workflows
        .map(w => ({
          id: w.id,
          name: w.type,
          successRate: w.stats?.successRate || 0,
          totalRuns: w.stats?.totalRuns || 0,
        }))
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5);

      setStats({
        totalWorkflows,
        activeWorkflows,
        successRate,
        totalExecutions,
        recentExecutions,
        topPerformingWorkflows,
        errorRate,
      });
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecentExecutions = async (userId: string) => {
    const { data: logs, error } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    // Group by date and count successes/failures
    const executions = logs.reduce<Record<string, { date: string; success: number; failed: number }>>((acc, log) => {
      const date = new Date(log.created_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, success: 0, failed: 0 };
      }
      if (log.status === 'sent') {
        acc[date].success++;
      } else {
        acc[date].failed++;
      }
      return acc;
    }, {});

    return Object.values(executions);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500">
        No workflow data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeWorkflows} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalExecutions} total executions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <XCircleIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errorRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {((stats.errorRate / 100) * stats.totalExecutions).toFixed(0)} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.recentExecutions[0]?.success || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successful executions today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Execution History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.recentExecutions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="success"
                    stroke="#22c55e"
                    name="Successful"
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke="#ef4444"
                    name="Failed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topPerformingWorkflows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="successRate" fill="#22c55e" name="Success Rate" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentExecutions.slice(0, 5).map((execution, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{execution.date}</p>
                  <p className="text-sm text-muted-foreground">
                    {execution.success} successful, {execution.failed} failed
                  </p>
                </div>
                <Badge variant={execution.failed > 0 ? "destructive" : "default"}>
                  {execution.failed > 0 ? "Issues" : "Healthy"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 