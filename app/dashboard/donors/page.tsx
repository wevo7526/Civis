'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { Donor } from '@/lib/types';
import { useToast } from '@/app/components/ui/use-toast';
import { Loader2, Plus, Search } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import AIInsightsSidebar from '@/app/components/AIInsightsSidebar';

interface DonorFormData {
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  total_given: number;
  last_gift_amount: number;
  last_gift_date: string;
  preferred_communication: 'email' | 'phone' | 'mail';
  notes: string;
  donation_date: string;
  amount: number;
}

const initialFormData: DonorFormData = {
  name: '',
  email: '',
  phone: '',
  status: 'active',
  total_given: 0,
  last_gift_amount: 0,
  last_gift_date: new Date().toISOString().split('T')[0],
  preferred_communication: 'email',
  notes: '',
  donation_date: new Date().toISOString().split('T')[0],
  amount: 0
};

export default function DonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [donorToDelete, setDonorToDelete] = useState<Donor | null>(null);
  const [donorToEdit, setDonorToEdit] = useState<Donor | null>(null);
  const [formData, setFormData] = useState<DonorFormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showInsights, setShowInsights] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    fetchDonors();
  }, []);

  useEffect(() => {
    filterDonors();
  }, [donors, searchQuery, filterType, filterStatus]);

  useEffect(() => {
    if (donorToEdit) {
      setFormData({
        name: donorToEdit.name || '',
        email: donorToEdit.email || '',
        phone: donorToEdit.phone || '',
        status: donorToEdit.status || 'active',
        total_given: donorToEdit.total_given || 0,
        last_gift_amount: donorToEdit.last_gift_amount || 0,
        last_gift_date: donorToEdit.last_gift_date || new Date().toISOString().split('T')[0],
        preferred_communication: donorToEdit.preferred_communication || 'email',
        notes: donorToEdit.notes || '',
        donation_date: donorToEdit.donation_date || new Date().toISOString().split('T')[0],
        amount: donorToEdit.amount || 0
      });
      setIsModalOpen(true);
    }
  }, [donorToEdit]);

  const filterDonors = () => {
    let filtered = [...donors];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(donor =>
        donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        donor.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(donor => donor.status === filterStatus);
    }

    setFilteredDonors(filtered);
  };

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
      setFilteredDonors(data || []);
    } catch (err) {
      console.error('Error fetching donors:', err);
      setError('Failed to fetch donors');
      toast({
        title: 'Error',
        description: 'Failed to fetch donors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditDonor = (donor: Donor) => {
    setDonorToEdit(donor);
    setFormData({
      name: donor.name || '',
      email: donor.email || '',
      phone: donor.phone || '',
      status: donor.status || 'active',
      total_given: donor.total_given || 0,
      last_gift_amount: donor.last_gift_amount || 0,
      last_gift_date: donor.last_gift_date || new Date().toISOString().split('T')[0],
      preferred_communication: donor.preferred_communication || 'email',
      notes: donor.notes || '',
      donation_date: donor.donation_date || new Date().toISOString().split('T')[0],
      amount: donor.amount || 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const donorData = {
        ...formData,
        total_given: Number(formData.total_given) || 0,
        last_gift_amount: Number(formData.last_gift_amount) || 0,
        last_gift_date: formData.last_gift_date || null,
        phone: formData.phone || null,
        preferred_communication: formData.preferred_communication || 'email',
        notes: formData.notes || null,
        amount: Number(formData.amount) || 0
      };

      if (donorToEdit) {
        const { error } = await supabase
          .from('donors')
          .update(donorData)
          .eq('id', donorToEdit.id);

        if (error) throw error;

        setDonors(prev => prev.map(d => 
          d.id === donorToEdit.id ? { ...d, ...donorData } as Donor : d
        ));
        toast({
          title: 'Success',
          description: 'Donor updated successfully',
        });
      } else {
        const { data: newDonor, error: insertError } = await supabase
          .from('donors')
          .insert([{ ...donorData, user_id: user.id }])
          .select()
          .single();

        if (insertError) throw insertError;
        if (newDonor) {
          setDonors(prev => [newDonor as Donor, ...prev]);
          toast({
            title: 'Success',
            description: 'Donor added successfully',
          });
        }
      }

      setIsModalOpen(false);
      setDonorToEdit(null);
      setFormData(initialFormData);
    } catch (err) {
      console.error('Error submitting donor:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to submit donor',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDonor = async () => {
    if (!donorToDelete) return;
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('donors')
        .delete()
        .eq('id', donorToDelete.id);

      if (error) throw error;

      setDonors(prev => prev.filter(d => d.id !== donorToDelete.id));
      toast({
        title: 'Success',
        description: 'Donor deleted successfully',
      });
    } catch (err) {
      console.error('Error deleting donor:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete donor');
      toast({
        title: 'Error',
        description: 'Failed to delete donor',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteModalOpen(false);
      setDonorToDelete(null);
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDonorToEdit(null);
    setFormData(initialFormData);
  };

  const handleGenerateMessage = async (donor: Donor) => {
    setGeneratingMessage(true);
    try {
      // TODO: Implement message generation
      toast({
        title: 'Coming Soon',
        description: 'Message generation is coming soon!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate message',
        variant: 'destructive',
      });
    } finally {
      setGeneratingMessage(false);
    }
  };

  const handleAnalyze = (donor: Donor) => {
    setShowInsights(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const stats = {
    totalDonors: donors.length,
    activeDonors: donors.filter(d => d.status === 'active').length,
    totalDonations: donors.reduce((acc, d) => acc + d.total_given, 0),
    averageDonation: donors.length > 0 
      ? donors.reduce((acc, d) => acc + d.total_given, 0) / donors.length 
      : 0,
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Given</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Gift</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDonors.map((donor) => (
              <tr key={donor.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{donor.name}</div>
                      <div className="text-sm text-gray-500">{donor.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    donor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {donor.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${donor.total_given.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {donor.last_gift_date ? new Date(donor.last_gift_date).toLocaleDateString() : 'No gifts yet'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditDonor(donor)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setDonorToDelete(donor);
                      setIsDeleteModalOpen(true);
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
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
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {donorToEdit ? 'Edit Donor' : 'Add New Donor'}
              </Dialog.Title>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_given">Total Given</Label>
                  <Input
                    type="number"
                    id="total_given"
                    value={formData.total_given || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_given: e.target.value === '' ? 0 : Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_gift_amount">Last Gift Amount</Label>
                  <Input
                    type="number"
                    id="last_gift_amount"
                    value={formData.last_gift_amount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_gift_amount: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_gift_date">Last Gift Date</Label>
                  <Input
                    type="date"
                    id="last_gift_date"
                    value={formData.last_gift_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_gift_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="donation_date">Donation Date</Label>
                  <Input
                    type="date"
                    id="donation_date"
                    value={formData.donation_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, donation_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred_communication">Preferred Communication</Label>
                  <Select
                    value={formData.preferred_communication}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_communication: value as 'email' | 'phone' | 'mail' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred communication" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="mail">Mail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    type="number"
                    id="amount"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
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

      {showInsights && (
        <AIInsightsSidebar
          donorData={donors}
          onClose={() => setShowInsights(false)}
        />
      )}
    </div>
  );
} 