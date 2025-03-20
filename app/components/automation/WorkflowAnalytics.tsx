'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface WorkflowAnalyticsProps {
  stats: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
  };
}

export function WorkflowAnalytics({ stats }: WorkflowAnalyticsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completed}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.completed / stats.total) * 100).toFixed(1)}% success rate
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed</CardTitle>
          <XCircleIcon className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.failed}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.failed / stats.total) * 100).toFixed(1)}% failure rate
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <ClockIcon className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pending}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.pending / stats.total) * 100).toFixed(1)}% in progress
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 