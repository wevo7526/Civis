'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { Donor } from '../../lib/types';
import { createDonorService } from '../../lib/donorService';

const initialFormData = {
  name: '',
  email: '',
  last_donation: new Date().toISOString().split('T')[0],
  amount: 0,
  engagement: 0,
  last_contact: new Date().toISOString().split('T')[0],
};

export default function Donors() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [donorToDelete, setDonorToDelete] = useState<Donor | null>(null);
  const [donorToEdit, setDonorToEdit] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormData);

  const supabase = createClientComponentClient();
  const donorService = useMemo(() => createDonorService(supabase), [supabase]);

  useEffect(() => {
    fetchDonors();
  }, [donorService]);

  useEffect(() => {
    if (donorToEdit) {
      setFormData({
        name: donorToEdit.name,
        email: donorToEdit.email,
        last_donation: donorToEdit.last_donation,
        amount: donorToEdit.amount,
        engagement: donorToEdit.engagement,
        last_contact: donorToEdit.last_contact,
      });
      setIsModalOpen(true);
    }
  }, [donorToEdit]);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const data = await donorService.getDonors();
      setDonors(data);
    } catch (err) {
      setError('Failed to fetch donors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (donorToEdit) {
        await donorService.updateDonor(donorToEdit.id, formData);
      } else {
        await donorService.addDonor(formData);
      }
      await fetchDonors();
      handleCloseModal();
    } catch (err) {
      setError(donorToEdit ? 'Failed to update donor' : 'Failed to add donor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDonor = async () => {
    if (!donorToDelete) return;
    try {
      setLoading(true);
      await donorService.deleteDonor(donorToDelete.id);
      await fetchDonors();
      setIsDeleteModalOpen(false);
      setDonorToDelete(null);
    } catch (err) {
      setError('Failed to delete donor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDonorToEdit(null);
    setFormData(initialFormData);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Donors</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Donor
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Donation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {donors.map((donor) => (
              <tr key={donor.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{donor.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{donor.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">${donor.amount.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(donor.last_donation).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{donor.engagement}%</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(donor.last_contact).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setDonorToDelete(donor);
                      setIsDeleteModalOpen(true);
                    }}
                    className="text-red-600 hover:text-red-900 mr-4"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setDonorToEdit(donor);
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

      {/* Add/Edit Donor Modal */}
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
                {donorToEdit ? 'Edit Donor' : 'Add New Donor'}
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
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div className="mt-4">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    Donation Amount
                  </label>
                  <input
                    type="number"
                    id="amount"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div className="mt-4">
                  <label htmlFor="last_donation" className="block text-sm font-medium text-gray-700">
                    Last Donation Date
                  </label>
                  <input
                    type="date"
                    id="last_donation"
                    required
                    value={formData.last_donation}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_donation: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div className="mt-4">
                  <label htmlFor="engagement" className="block text-sm font-medium text-gray-700">
                    Engagement Level (0-100)
                  </label>
                  <input
                    type="number"
                    id="engagement"
                    required
                    min="0"
                    max="100"
                    value={formData.engagement}
                    onChange={(e) => setFormData(prev => ({ ...prev, engagement: parseInt(e.target.value) }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div className="mt-4">
                  <label htmlFor="last_contact" className="block text-sm font-medium text-gray-700">
                    Last Contact Date
                  </label>
                  <input
                    type="date"
                    id="last_contact"
                    required
                    value={formData.last_contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_contact: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {loading ? (donorToEdit ? 'Updating...' : 'Adding...') : (donorToEdit ? 'Update Donor' : 'Add Donor')}
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
                Delete Donor
              </Dialog.Title>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete {donorToDelete?.name}? This action cannot be undone.
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
                onClick={handleDeleteDonor}
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