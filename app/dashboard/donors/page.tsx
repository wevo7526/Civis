'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { DonorForm } from '@/app/components/DonorForm';
import type { Donor } from '@/app/lib/types';
import { toast } from 'react-hot-toast';

export default function DonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [donorToEdit, setDonorToEdit] = useState<Donor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('donors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDonors(data || []);
    } catch (err) {
      console.error('Error fetching donors:', err);
      setError('Failed to fetch donors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Omit<Donor, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (donorToEdit) {
        const { error: updateError } = await supabase
          .from('donors')
          .update(data)
          .eq('id', donorToEdit.id);

        if (updateError) throw updateError;

        setDonors(prev => prev.map(d => 
          d.id === donorToEdit.id ? { ...d, ...data } : d
        ));
      } else {
        const { data: newDonor, error: insertError } = await supabase
          .from('donors')
          .insert([{ ...data, user_id: user.id }])
          .select()
          .single();

        if (insertError) throw insertError;
        if (newDonor) {
          setDonors(prev => [newDonor, ...prev]);
        }
      }

      setIsFormOpen(false);
      setDonorToEdit(null);
    } catch (err) {
      console.error('Error saving donor:', err);
      setError('Failed to save donor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this donor?')) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('donors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDonors(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Error deleting donor:', err);
      setError('Failed to delete donor');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Donors</h1>
        <button
          onClick={() => {
            setDonorToEdit(null);
            setIsFormOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Donor
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {donors.map(donor => (
          <div
            key={donor.id}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {donor.name}
                </h3>
                <p className="text-sm text-gray-500">{donor.email}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                donor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {donor.status}
              </span>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Donation History</h4>
              <div className="text-sm text-gray-600">
                <p>Total Given: ${donor.total_given.toLocaleString()}</p>
                <p>Last Gift: ${donor.last_gift_amount.toLocaleString()}</p>
                <p>Last Gift Date: {new Date(donor.last_gift_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Contact Info</h4>
              <div className="text-sm text-gray-600">
                <p>Phone: {donor.phone || 'N/A'}</p>
                <p>Preferred Contact: {donor.preferred_communication}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setDonorToEdit(donor);
                  setIsFormOpen(true);
                }}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(donor.id)}
                disabled={isDeleting}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {donorToEdit ? 'Edit Donor' : 'Add New Donor'}
              </h2>
              <DonorForm
                donor={donorToEdit || undefined}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsFormOpen(false);
                  setDonorToEdit(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 