'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';

interface Stakeholder {
  id: string;
  name: string;
  role: string;
  organization: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
}

export default function Stakeholders() {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({
    name: '',
    role: '',
    organization: '',
    email: '',
    phone: '',
    notes: '',
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchStakeholders();
  }, []);

  const fetchStakeholders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('stakeholders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStakeholders(data || []);
    } catch (err) {
      console.error('Error fetching stakeholders:', err);
      setError('Failed to load stakeholders');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStakeholder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('stakeholders')
        .insert([
          {
            ...newStakeholder,
            user_id: user.id,
          },
        ]);

      if (error) throw error;

      setNewStakeholder({
        name: '',
        role: '',
        organization: '',
        email: '',
        phone: '',
        notes: '',
      });
      setIsAddModalOpen(false);
      fetchStakeholders();
    } catch (err) {
      console.error('Error adding stakeholder:', err);
      setError('Failed to add stakeholder');
    }
  };

  const handleDeleteStakeholder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('stakeholders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchStakeholders();
    } catch (err) {
      console.error('Error deleting stakeholder:', err);
      setError('Failed to delete stakeholder');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchStakeholders}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Stakeholders</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          Add Stakeholder
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stakeholders.map((stakeholder) => (
          <Card key={stakeholder.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {stakeholder.name}
                </h3>
                <p className="text-gray-600">{stakeholder.role}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleDeleteStakeholder(stakeholder.id)}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Organization:</span>{' '}
                {stakeholder.organization}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Email:</span> {stakeholder.email}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Phone:</span> {stakeholder.phone}
              </p>
              {stakeholder.notes && (
                <p className="text-gray-600">
                  <span className="font-medium">Notes:</span> {stakeholder.notes}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">Add Stakeholder</h2>
            <form onSubmit={handleAddStakeholder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={newStakeholder.name}
                  onChange={(e) =>
                    setNewStakeholder({ ...newStakeholder, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <input
                  type="text"
                  value={newStakeholder.role}
                  onChange={(e) =>
                    setNewStakeholder({ ...newStakeholder, role: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Organization
                </label>
                <input
                  type="text"
                  value={newStakeholder.organization}
                  onChange={(e) =>
                    setNewStakeholder({
                      ...newStakeholder,
                      organization: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={newStakeholder.email}
                  onChange={(e) =>
                    setNewStakeholder({ ...newStakeholder, email: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newStakeholder.phone}
                  onChange={(e) =>
                    setNewStakeholder({ ...newStakeholder, phone: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={newStakeholder.notes}
                  onChange={(e) =>
                    setNewStakeholder({ ...newStakeholder, notes: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Stakeholder</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
} 