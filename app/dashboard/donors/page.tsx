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
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  total_given: number;
  last_gift_amount: number;
  last_gift_date: string;
  preferred_communication: 'email' | 'phone' | 'mail';
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one-time';
  recurring: boolean;
  payment_method: 'online' | 'check' | 'cash';
  interaction_count: number;
  user_id: string;
}

const initialFormData: DonorFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  total_given: 0,
  last_gift_amount: 0,
  last_gift_date: new Date().toISOString().split('T')[0],
  preferred_communication: 'email',
  frequency: 'one-time',
  recurring: false,
  payment_method: 'online',
  interaction_count: 0,
  user_id: ''
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
  }, [donors, searchQuery, filterType]);

  useEffect(() => {
    if (donorToEdit) {
      setFormData({
        first_name: donorToEdit.first_name || '',
        last_name: donorToEdit.last_name || '',
        email: donorToEdit.email || '',
        phone: donorToEdit.phone || '',
        address: donorToEdit.address || '',
        city: donorToEdit.city || '',
        state: donorToEdit.state || '',
        zip_code: donorToEdit.zip_code || '',
        total_given: donorToEdit.total_given || 0,
        last_gift_amount: donorToEdit.last_gift_amount || 0,
        last_gift_date: donorToEdit.last_gift_date || new Date().toISOString().split('T')[0],
        preferred_communication: donorToEdit.preferred_communication || 'email',
        frequency: donorToEdit.frequency || 'one-time',
        recurring: donorToEdit.recurring || false,
        payment_method: donorToEdit.payment_method || 'online',
        interaction_count: donorToEdit.interaction_count || 0,
        user_id: donorToEdit.user_id || ''
      });
      setIsModalOpen(true);
    }
  }, [donorToEdit]);

  const filterDonors = () => {
    let filtered = [...donors];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(donor =>
        `${donor.first_name} ${donor.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        donor.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(donor => donor.frequency === filterType);
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
      first_name: donor.first_name || '',
      last_name: donor.last_name || '',
      email: donor.email || '',
      phone: donor.phone || '',
      address: donor.address || '',
      city: donor.city || '',
      state: donor.state || '',
      zip_code: donor.zip_code || '',
      total_given: donor.total_given || 0,
      last_gift_amount: donor.last_gift_amount || 0,
      last_gift_date: donor.last_gift_date || new Date().toISOString().split('T')[0],
      preferred_communication: donor.preferred_communication || 'email',
      frequency: donor.frequency || 'one-time',
      recurring: donor.recurring || false,
      payment_method: donor.payment_method || 'online',
      interaction_count: donor.interaction_count || 0,
      user_id: donor.user_id || ''
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
        frequency: formData.frequency || 'one-time',
        recurring: formData.recurring || false,
        payment_method: formData.payment_method || 'online',
        interaction_count: formData.interaction_count || 0,
        user_id: user.id
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
          .insert([donorData])
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
    recurringDonors: donors.filter(d => d.recurring).length,
    totalDonations: donors.reduce((acc, d) => acc + d.total_given, 0),
    averageDonation: donors.length > 0 
      ? donors.reduce((acc, d) => acc + d.total_given, 0) / donors.length 
      : 0,
  };

  const donorEngagement = donors.map(donor => ({
    name: `${donor.first_name} ${donor.last_name}`,
    total_given: donor.total_given,
    interaction_count: donor.interaction_count || 0,
    last_gift_date: donor.last_gift_date,
    frequency: donor.frequency,
    recurring: donor.recurring
  }));

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

      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search donors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frequencies</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="annual">Annual</SelectItem>
            <SelectItem value="one-time">One-time</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Donor
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
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
                      <div className="text-sm font-medium text-gray-900">{donor.first_name} {donor.last_name}</div>
                      <div className="text-sm text-gray-500">{donor.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    donor.recurring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {donor.frequency}
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
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
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
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">Zip Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                  />
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
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value as 'monthly' | 'quarterly' | 'annual' | 'one-time' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="one-time">One-Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurring">Recurring</Label>
                  <Select
                    value={formData.recurring ? 'yes' : 'no'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, recurring: value === 'yes' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recurring" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value as 'online' | 'check' | 'cash' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interaction_count">Interaction Count</Label>
                  <Input
                    type="number"
                    id="interaction_count"
                    value={formData.interaction_count || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, interaction_count: e.target.value === '' ? 0 : Number(e.target.value) }))}
                  />
                </div>
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
                Are you sure you want to delete {donorToDelete?.first_name} {donorToDelete?.last_name}? This action cannot be undone.
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