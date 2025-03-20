'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  type: 'fundraiser' | 'volunteer' | 'community' | 'other';
  status: 'active' | 'completed' | 'planned' | 'cancelled';
  created_at: string;
  updated_at: string;
  max_volunteers?: number;
  volunteer_ids?: string[];
  volunteer_hours?: { [key: string]: number };
}

interface EventFormData {
  name: string;
  description: string;
  date: string;
  location: string;
  type: 'fundraiser' | 'volunteer' | 'community' | 'other';
  status: 'active' | 'completed' | 'planned' | 'cancelled';
  max_volunteers?: number;
}

const initialFormData: EventFormData = {
  name: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  location: '',
  type: 'volunteer',
  status: 'planned',
  max_volunteers: 10
};

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        name: eventToEdit.name,
        description: eventToEdit.description,
        date: eventToEdit.date,
        location: eventToEdit.location,
        type: eventToEdit.type,
        status: eventToEdit.status,
        max_volunteers: eventToEdit.max_volunteers,
      });
      setIsModalOpen(true);
    }
  }, [eventToEdit]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (eventToEdit) {
        const { error } = await supabase
          .from('events')
          .update(formData)
          .eq('id', eventToEdit.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('events')
          .insert({
            ...formData,
            user_id: user.id,
          });

        if (error) throw error;
      }

      await fetchEvents();
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting event:', error);
      setError(error instanceof Error ? error.message : 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventToDelete.id);

      if (error) throw error;

      await fetchEvents();
      setIsDeleteModalOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEventToEdit(null);
    setFormData(initialFormData);
  };

  const handleVolunteerSignup = async (eventId: string, volunteerId: string) => {
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const volunteer_ids = [...(event.volunteer_ids || [])];
      if (volunteer_ids.includes(volunteerId)) return;

      if (event.max_volunteers && volunteer_ids.length >= event.max_volunteers) {
        throw new Error('Event has reached maximum volunteer capacity');
      }

      volunteer_ids.push(volunteerId);

      const { error } = await supabase
        .from('events')
        .update({ volunteer_ids })
        .eq('id', eventId);

      if (error) throw error;

      // Refresh events list
      fetchEvents();
    } catch (err) {
      console.error('Error signing up volunteer:', err);
    }
  };

  const handleVolunteerHours = async (eventId: string, volunteerId: string, hours: number) => {
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const volunteer_hours = { ...(event.volunteer_hours || {}) };
      volunteer_hours[volunteerId] = hours;

      const { error } = await supabase
        .from('events')
        .update({ volunteer_hours })
        .eq('id', eventId);

      if (error) throw error;

      // Refresh events list
      fetchEvents();
    } catch (err) {
      console.error('Error updating volunteer hours:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Event
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volunteers</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{event.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{event.type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{event.location}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    event.status === 'active' ? 'bg-green-100 text-green-800' :
                    event.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {event.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {event.volunteer_ids?.length || 0}
                    {event.max_volunteers && ` / ${event.max_volunteers}`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => {
                      setEventToDelete(event);
                      setIsDeleteModalOpen(true);
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setEventToEdit(event);
                    }}
                    className="text-purple-600 hover:text-purple-900"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Event Modal */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {eventToEdit ? 'Edit Event' : 'Add New Event'}
              </Dialog.Title>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    id="type"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Event['type'] }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  >
                    <option value="fundraiser">Fundraiser</option>
                    <option value="volunteer">Volunteer Event</option>
                    <option value="community">Community Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    required
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Event['status'] }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  >
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {formData.type === 'volunteer' && (
                  <div>
                    <label htmlFor="max_volunteers" className="block text-sm font-medium text-gray-700">
                      Maximum Volunteers
                    </label>
                    <input
                      type="number"
                      id="max_volunteers"
                      min="1"
                      value={formData.max_volunteers}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_volunteers: parseInt(e.target.value) }))}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {loading ? (eventToEdit ? 'Updating...' : 'Adding...') : (eventToEdit ? 'Update Event' : 'Add Event')}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm w-full bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Delete Event
              </Dialog.Title>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete {eventToDelete?.name}? This action cannot be undone.
              </p>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 