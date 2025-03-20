'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { volunteerService } from '@/lib/volunteerService';
import type { VolunteerActivity } from '@/lib/types';

export default function CommunityPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<VolunteerActivity[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    totalHours: number;
    uniqueSkills: number;
  }>({
    total: 0,
    active: 0,
    totalHours: 0,
    uniqueSkills: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [activitiesData, statsData] = await Promise.all([
        volunteerService.getActivities({ upcoming: true }),
        volunteerService.getVolunteerStats(),
      ]);

      setActivities(activitiesData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: VolunteerActivity['status']): string => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'filled':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Hub</h1>
          <p className="mt-2 text-gray-600">
            Connect with volunteers and make a difference in your community
          </p>
        </div>
        <div className="flex space-x-4">
          <Button
            onClick={() => router.push('/dashboard/community/volunteers')}
            variant="outline"
          >
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Manage Volunteers
          </Button>
          <Button
            onClick={() => router.push('/dashboard/events')}
            variant="outline"
          >
            <CalendarIcon className="h-5 w-5 mr-2" />
            Manage Events
          </Button>
          <Button
            onClick={() => router.push('/dashboard/community/activities/new')}
          >
            <CalendarIcon className="h-5 w-5 mr-2" />
            Create Activity
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Volunteers</p>
              <h3 className="text-xl font-semibold text-gray-900">{stats.total}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Volunteers</p>
              <h3 className="text-xl font-semibold text-gray-900">{stats.active}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Hours</p>
              <h3 className="text-xl font-semibold text-gray-900">{stats.totalHours}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Unique Skills</p>
              <h3 className="text-xl font-semibold text-gray-900">{stats.uniqueSkills}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Upcoming Activities */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Activities</h2>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/community/activities')}
          >
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <Card
              key={activity.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/community/activities/${activity.id}`)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {activity.description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {activity.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {new Date(activity.start_time).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    {new Date(activity.start_time).toLocaleTimeString()} - {new Date(activity.end_time).toLocaleTimeString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    {activity.participant_ids.length} / {activity.max_participants} volunteers
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {activities.length === 0 && (
            <div className="col-span-full text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming activities</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new volunteer activity.</p>
              <div className="mt-6">
                <Button onClick={() => router.push('/dashboard/community/activities/new')}>
                  Create New Activity
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 