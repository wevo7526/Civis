'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowLeftIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { volunteerService } from '@/lib/volunteerService';
import type { VolunteerActivity } from '@/lib/types';

export default function ActivityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [activity, setActivity] = useState<VolunteerActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
    fetchActivity();
  }, [params.id]);

  const fetchActivity = async () => {
    try {
      const activity = await volunteerService.getActivityById(params.id as string);
      if (!activity) throw new Error('Activity not found');
      setActivity(activity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activity) return;

    try {
      await volunteerService.deleteActivity(activity.id);
      router.push('/dashboard/volunteer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete activity');
    }
  };

  const handleStatusChange = async (newStatus: VolunteerActivity['status']) => {
    if (!activity) return;

    try {
      await volunteerService.updateActivity(activity.id, { status: newStatus });
      await fetchActivity();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update activity status');
    }
  };

  const handleJoinActivity = async () => {
    if (!activity || !userId) return;

    try {
      await volunteerService.joinActivity(activity.id, userId);
      await fetchActivity();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join activity');
    }
  };

  const handleLeaveActivity = async () => {
    if (!activity || !userId) return;

    try {
      await volunteerService.leaveActivity(activity.id, userId);
      await fetchActivity();
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

  if (error || !activity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error || 'Activity not found'}</p>
        <button
          onClick={() => router.push('/dashboard/volunteer')}
          className="text-purple-600 hover:text-purple-800"
        >
          Back to Activities
        </button>
      </div>
    );
  }

  const isOrganizer = activity.organizer_id === userId;
  const isParticipant = activity.participant_ids.includes(userId || '');

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => router.push('/dashboard/volunteer')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to Activities
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{activity.title}</h1>
            <Badge className={`mt-2 ${getStatusColor(activity.status)}`}>
              {activity.status}
            </Badge>
          </div>
          {isOrganizer && (
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/volunteer/${activity.id}/edit`)}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className="prose max-w-none mb-8">
          <p>{activity.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center text-gray-600">
              <MapPinIcon className="h-5 w-5 mr-3" />
              <span>{activity.location}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <CalendarIcon className="h-5 w-5 mr-3" />
              <span>{new Date(activity.start_time).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <ClockIcon className="h-5 w-5 mr-3" />
              <span>
                {new Date(activity.start_time).toLocaleTimeString()} - {new Date(activity.end_time).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center text-gray-600">
              <UserGroupIcon className="h-5 w-5 mr-3" />
              <span>{activity.participant_ids.length} / {activity.max_participants} volunteers</span>
            </div>
          </div>

          {isOrganizer && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Manage Activity</h3>
              <div className="flex flex-wrap gap-4">
                {activity.status !== 'completed' && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('completed')}
                  >
                    Mark as Completed
                  </Button>
                )}
                {activity.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('cancelled')}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    Cancel Activity
                  </Button>
                )}
              </div>
            </div>
          )}

          {!isOrganizer && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Participation</h3>
              {isParticipant ? (
                <Button variant="outline" onClick={handleLeaveActivity}>
                  Leave Activity
                </Button>
              ) : activity.status === 'open' && (
                <Button onClick={handleJoinActivity}>
                  Join Activity
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Participants List */}
        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Participants</h2>
          {activity.participant_ids.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activity.participant_ids.map((participantId) => (
                <div
                  key={participantId}
                  className="flex items-center p-3 bg-gray-50 rounded-lg"
                >
                  <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">Volunteer #{participantId.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No participants yet</p>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the activity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 