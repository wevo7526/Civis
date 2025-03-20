'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { volunteerService } from '@/lib/volunteerService';
import type { VolunteerActivity } from '@/lib/types';

export default function VolunteerActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<VolunteerActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, [supabase.auth]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const activities = await volunteerService.getActivities();
      setActivities(activities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinActivity = async (activityId: string) => {
    if (!userId) {
      router.push('/login');
      return;
    }

    try {
      await volunteerService.joinActivity(activityId, userId);
      await fetchActivities(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join activity');
    }
  };

  const handleLeaveActivity = async (activityId: string) => {
    if (!userId) return;

    try {
      await volunteerService.leaveActivity(activityId, userId);
      await fetchActivities(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave activity');
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Volunteer Activities</h1>
          <p className="mt-2 text-gray-600">
            Join activities and make a difference in your community
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/volunteer/new')}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Activity
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => (
          <Card key={activity.id} className="overflow-hidden">
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
              <div className="mt-4 space-x-4">
                {activity.organizer_id === userId ? (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/dashboard/volunteer/${activity.id}`)}
                  >
                    Manage Activity
                  </Button>
                ) : activity.participant_ids.includes(userId || '') ? (
                  <Button
                    variant="outline"
                    onClick={() => handleLeaveActivity(activity.id)}
                  >
                    Leave Activity
                  </Button>
                ) : activity.status === 'open' && (
                  <Button
                    onClick={() => handleJoinActivity(activity.id)}
                  >
                    Join Activity
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {activities.length === 0 && (
          <div className="col-span-full text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activities</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new volunteer activity.</p>
            <div className="mt-6">
              <Button onClick={() => router.push('/dashboard/volunteer/new')}>
                Create New Activity
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 