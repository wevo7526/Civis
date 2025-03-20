'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  ClockIcon,
  HandRaisedIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  CalendarIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Volunteer, volunteerService } from '@/lib/volunteerService';

export default function VolunteerDetails() {
  const params = useParams();
  const router = useRouter();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [volunteerHours, setVolunteerHours] = useState<{ date: string; hours: number; description: string; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLogHoursModalOpen, setIsLogHoursModalOpen] = useState(false);
  const [hoursFormData, setHoursFormData] = useState({
    hours: '',
    description: '',
  });

  useEffect(() => {
    fetchVolunteerData();
  }, [params.id]);

  const fetchVolunteerData = async () => {
    try {
      const volunteer = await volunteerService.getVolunteerById(params.id as string);
      if (!volunteer) throw new Error('Volunteer not found');
      setVolunteer(volunteer);

      const hours = await volunteerService.getVolunteerHours(volunteer.id);
      setVolunteerHours(hours);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch volunteer data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteer) return;

    try {
      await volunteerService.logVolunteerHours(
        volunteer.id,
        Number(hoursFormData.hours),
        hoursFormData.description
      );
      setIsLogHoursModalOpen(false);
      setHoursFormData({ hours: '', description: '' });
      fetchVolunteerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log hours');
    }
  };

  const handleDeleteVolunteer = async () => {
    if (!volunteer) return;

    try {
      await volunteerService.deleteVolunteer(volunteer.id);
      router.push('/dashboard/community/volunteers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete volunteer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !volunteer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error || 'Volunteer not found'}</p>
        <button
          onClick={() => router.push('/dashboard/community/volunteers')}
          className="text-purple-600 hover:text-purple-800"
        >
          Back to Volunteers
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <button
            onClick={() => router.push('/dashboard/community/volunteers')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Volunteers
          </button>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => setIsLogHoursModalOpen(true)}
            >
              <ClockIcon className="h-5 w-5 mr-2" />
              Log Hours
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete Volunteer
            </Button>
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-2xl text-purple-600 font-medium">
              {volunteer.first_name[0]}{volunteer.last_name[0]}
            </span>
          </div>
          <div className="ml-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {volunteer.first_name} {volunteer.last_name}
            </h1>
            <p className="text-gray-600">{volunteer.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Volunteer Info */}
        <div className="col-span-2 space-y-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Volunteer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <Badge
                  variant={volunteer.status === 'active' ? 'secondary' : 'outline'}
                  className="mt-1"
                >
                  {volunteer.status}
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                <p className="mt-1 text-gray-900">{volunteer.phone || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Hours</h3>
                <p className="mt-1 text-gray-900">{volunteer.total_hours} hours</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                <p className="mt-1 text-gray-900">
                  {new Date(volunteer.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills & Interests</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Skills</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {volunteer.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Interests</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {volunteer.interests.map((interest, index) => (
                    <Badge key={index} variant="outline">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Availability</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Weekdays</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {volunteer.availability.weekdays.map((day, index) => (
                    <Badge key={index} variant="secondary">
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Weekend Availability</h3>
                <p className="mt-1 text-gray-900">
                  {volunteer.availability.weekends ? 'Available' : 'Not available'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Hours</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(volunteer.availability.hours).map(([key, value]) => (
                    value && (
                      <Badge key={key} variant="secondary">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Badge>
                    )
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Hours Log */}
        <div className="space-y-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Hours Log</h2>
            <div className="space-y-4">
              {volunteerHours.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <ClockIcon className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{entry.hours} hours</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                  </div>
                </div>
              ))}

              {volunteerHours.length === 0 && (
                <div className="text-center py-6">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-500">No hours logged yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Log Hours Modal */}
      <Transition appear show={isLogHoursModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsLogHoursModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Log Volunteer Hours
                  </Dialog.Title>

                  <form onSubmit={handleLogHours} className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="hours" className="block text-sm font-medium text-gray-700">
                        Hours
                      </label>
                      <input
                        type="number"
                        id="hours"
                        min="0"
                        step="0.5"
                        required
                        value={hoursFormData.hours}
                        onChange={(e) => setHoursFormData(prev => ({ ...prev, hours: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        required
                        value={hoursFormData.description}
                        onChange={(e) => setHoursFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      />
                    </div>

                    <div className="mt-6 flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsLogHoursModalOpen(false);
                          setHoursFormData({ hours: '', description: '' });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        Log Hours
                      </Button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsDeleteModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Delete Volunteer
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this volunteer? This action cannot be undone.
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDeleteModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteVolunteer}
                    >
                      Delete
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
} 