'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Donor } from '@/app/lib/types';
import { PlusIcon, EnvelopeIcon, PhoneIcon, CurrencyDollarIcon, ChartBarIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';

export default function Donors() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    last_donation: string;
    amount: string;
    engagement: string;
    last_contact: string;
  }>({
    name: '',
    email: '',
    last_donation: new Date().toISOString().split('T')[0],
    amount: '',
    engagement: '50',
    last_contact: new Date().toISOString().split('T')[0],
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
      setError(err instanceof Error ? err.message : 'Failed to fetch donors');
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
      setError(err instanceof Error ? err.message : 'Failed to delete donor');
    }
  };

  const handleGenerateMessage = async (donor: Donor) => {
    setSelectedDonor(donor);
    setIsAISidebarOpen(true);
    setIsGeneratingMessage(true);
    setError(null);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateDonorMessage',
          data: donor,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate message');
      }

      const data = await response.json();
      setAiMessage(data.content);
    } catch (err) {
      console.error('Error generating message:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate message');
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedDonor) return;

    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedDonor.email,
          subject: 'Personalized Message from Your Organization',
          content: aiMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      // Update last contact date
      const { error } = await supabase
        .from('donors')
        .update({ last_contact: new Date().toISOString().split('T')[0] })
        .eq('id', selectedDonor.id);

      if (error) throw error;

      setIsAISidebarOpen(false);
      setSelectedDonor(null);
      setAiMessage('');
      fetchDonors();
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err instanceof Error ? err.message : 'Failed to send email');
    }
  };

  const handleCreateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Validate form data
      if (!formData.name.trim()) throw new Error('Name is required');
      if (!formData.email.trim()) throw new Error('Email is required');
      if (!formData.last_donation) throw new Error('Last donation date is required');
      if (!formData.amount || parseFloat(formData.amount) <= 0) throw new Error('Valid donation amount is required');
      if (!formData.engagement || parseInt(formData.engagement) < 0 || parseInt(formData.engagement) > 100) {
        throw new Error('Engagement score must be between 0 and 100');
      }
      if (!formData.last_contact) throw new Error('Last contact date is required');

      const donorData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        last_donation: formData.last_donation,
        amount: parseFloat(formData.amount),
        engagement: parseInt(formData.engagement),
        last_contact: formData.last_contact,
        user_id: user.id,
      };

      console.log('Attempting to save donor:', donorData);

      const { data: savedDonor, error } = await supabase
        .from('donors')
        .insert([donorData])
        .select()
        .single();

      if (error) {
        console.error('Supabase save error:', error);
        throw new Error(`Failed to save donor: ${error.message}`);
      }

      if (!savedDonor) {
        throw new Error('No donor was saved');
      }

      console.log('Successfully saved donor:', savedDonor);

      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        last_donation: new Date().toISOString().split('T')[0],
        amount: '',
        engagement: '50',
        last_contact: new Date().toISOString().split('T')[0],
      });
      fetchDonors();
    } catch (err) {
      console.error('Error creating donor:', err);
      setError(err instanceof Error ? err.message : 'Failed to create donor');
    } finally {
      setLoading(false);
    }
  };

  const getEngagementLevel = (engagement: number) => {
    if (engagement >= 80) return { text: 'High', color: 'bg-green-100 text-green-800' };
    if (engagement >= 50) return { text: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Low', color: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Donors</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setIsAISidebarOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                AI Assistant
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Donor
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donors.map((donor) => {
              const engagement = getEngagementLevel(donor.engagement);
              return (
                <div
                  key={donor.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{donor.name}</h3>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${engagement.color}`}>
                        {engagement.text} Engagement
                      </span>
                      <button
                        onClick={() => handleGenerateMessage(donor)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <EnvelopeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDonor(donor.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      <span>{donor.email}</span>
                    </div>
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                      <span>Last Donation: ${donor.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center">
                      <ChartBarIcon className="h-4 w-4 mr-2" />
                      <span>Engagement Score: {donor.engagement}%</span>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      <span>Last Contact: {new Date(donor.last_contact).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isAISidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">AI Assistant</h2>
              <button
                onClick={() => setIsAISidebarOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {isGeneratingMessage ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDonor && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900">Selected Donor</h3>
                    <p className="text-sm text-gray-600">{selectedDonor.name}</p>
                    <p className="text-sm text-gray-600">{selectedDonor.email}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generated Message
                  </label>
                  <textarea
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    rows={8}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={handleSendEmail}
              disabled={!selectedDonor || !aiMessage || isGeneratingMessage}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Email
            </button>
          </div>
        </div>
      </div>

      {/* Existing Add Donor Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Add New Donor
              </Dialog.Title>
            </div>
            
            <form onSubmit={handleCreateDonor} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Donor Name
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

                <div>
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

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    Donation Amount
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="amount"
                      required
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="mt-1 block w-full pl-7 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="engagement" className="block text-sm font-medium text-gray-700">
                    Engagement Score (0-100)
                  </label>
                  <input
                    type="number"
                    id="engagement"
                    required
                    min="0"
                    max="100"
                    value={formData.engagement}
                    onChange={(e) => setFormData(prev => ({ ...prev, engagement: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div>
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

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Donor'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 