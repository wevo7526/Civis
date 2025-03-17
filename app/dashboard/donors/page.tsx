'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';

interface Donor {
  id: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  donation_amount: number;
  donation_date: string;
  notes: string;
  created_at: string;
}

export default function Donors() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDonor, setNewDonor] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    donation_amount: '',
    donation_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('donors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDonors(data || []);
    } catch (err) {
      console.error('Error fetching donors:', err);
      setError('Failed to load donors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('donors')
        .insert([
          {
            ...newDonor,
            donation_amount: parseFloat(newDonor.donation_amount),
            user_id: user.id,
          },
        ]);

      if (error) throw error;

      setNewDonor({
        name: '',
        email: '',
        phone: '',
        organization: '',
        donation_amount: '',
        donation_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setIsAddModalOpen(false);
      fetchDonors();
    } catch (err) {
      console.error('Error adding donor:', err);
      setError('Failed to add donor');
    }
  };

  const handleDeleteDonor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('donors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchDonors();
    } catch (err) {
      console.error('Error deleting donor:', err);
      setError('Failed to delete donor');
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
        <Button onClick={fetchDonors}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Donors</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          Add Donor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {donors.map((donor) => (
          <Card key={donor.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {donor.name}
                </h3>
                <p className="text-gray-600">{donor.organization}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleDeleteDonor(donor.id)}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Email:</span> {donor.email}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Phone:</span> {donor.phone}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Donation Amount:</span>{' '}
                ${donor.donation_amount.toLocaleString()}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Donation Date:</span>{' '}
                {new Date(donor.donation_date).toLocaleDateString()}
              </p>
              {donor.notes && (
                <p className="text-gray-600">
                  <span className="font-medium">Notes:</span> {donor.notes}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">Add Donor</h2>
            <form onSubmit={handleAddDonor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={newDonor.name}
                  onChange={(e) =>
                    setNewDonor({ ...newDonor, name: e.target.value })
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
                  value={newDonor.email}
                  onChange={(e) =>
                    setNewDonor({ ...newDonor, email: e.target.value })
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
                  value={newDonor.phone}
                  onChange={(e) =>
                    setNewDonor({ ...newDonor, phone: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Organization
                </label>
                <input
                  type="text"
                  value={newDonor.organization}
                  onChange={(e) =>
                    setNewDonor({ ...newDonor, organization: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Donation Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newDonor.donation_amount}
                  onChange={(e) =>
                    setNewDonor({ ...newDonor, donation_amount: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Donation Date
                </label>
                <input
                  type="date"
                  value={newDonor.donation_date}
                  onChange={(e) =>
                    setNewDonor({ ...newDonor, donation_date: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={newDonor.notes}
                  onChange={(e) =>
                    setNewDonor({ ...newDonor, notes: e.target.value })
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
                <Button type="submit">Add Donor</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
} 