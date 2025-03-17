'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  CalendarIcon,
  SparklesIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';

interface Stakeholder {
  id: string;
  name: string;
  type: 'individual' | 'organization' | 'government' | 'media' | 'community';
  role: string;
  email: string;
  phone: string;
  organization?: string;
  notes: string;
  engagement_score: number;
  last_contact: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export default function Stakeholders() {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    type: Stakeholder['type'];
    role: string;
    email: string;
    phone: string;
    organization: string;
    notes: string;
    engagement_score: string;
    last_contact: string;
  }>({
    name: '',
    type: 'individual',
    role: '',
    email: '',
    phone: '',
    organization: '',
    notes: '',
    engagement_score: '50',
    last_contact: new Date().toISOString().split('T')[0],
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
      setError(err instanceof Error ? err.message : 'Failed to fetch stakeholders');
    }
  };

  const handleCreateStakeholder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const stakeholderData = {
        ...formData,
        user_id: user.id,
        engagement_score: parseInt(formData.engagement_score),
      };

      const { error } = await supabase
        .from('stakeholders')
        .insert([stakeholderData]);

      if (error) throw error;

      setIsModalOpen(false);
      setFormData({
        name: '',
        type: 'individual',
        role: '',
        email: '',
        phone: '',
        organization: '',
        notes: '',
        engagement_score: '50',
        last_contact: new Date().toISOString().split('T')[0],
      });
      fetchStakeholders();
    } catch (err) {
      console.error('Error creating stakeholder:', err);
      setError(err instanceof Error ? err.message : 'Failed to create stakeholder');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMessage = async (stakeholder: Stakeholder) => {
    setSelectedStakeholder(stakeholder);
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
          action: 'generateStakeholderMessage',
          data: stakeholder,
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
    if (!selectedStakeholder) return;

    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedStakeholder.email,
          subject: 'Personalized Message from Your Organization',
          content: aiMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      // Update last contact date
      const { error } = await supabase
        .from('stakeholders')
        .update({ last_contact: new Date().toISOString().split('T')[0] })
        .eq('id', selectedStakeholder.id);

      if (error) throw error;

      setIsAISidebarOpen(false);
      setSelectedStakeholder(null);
      setAiMessage('');
      fetchStakeholders();
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err instanceof Error ? err.message : 'Failed to send email');
    }
  };

  const getStakeholderIcon = (type: Stakeholder['type']) => {
    switch (type) {
      case 'individual':
        return <UserIcon className="h-5 w-5" />;
      case 'organization':
        return <BuildingOfficeIcon className="h-5 w-5" />;
      case 'government':
        return <UserGroupIcon className="h-5 w-5" />;
      case 'media':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'community':
        return <UserGroupIcon className="h-5 w-5" />;
      default:
        return <UserIcon className="h-5 w-5" />;
    }
  };

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { text: 'High', color: 'bg-green-100 text-green-800' };
    if (score >= 50) return { text: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Low', color: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Stakeholders</h1>
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
                New Stakeholder
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stakeholders.map((stakeholder) => {
              const engagement = getEngagementLevel(stakeholder.engagement_score);
              return (
                <div
                  key={stakeholder.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      {getStakeholderIcon(stakeholder.type)}
                      <h3 className="ml-2 text-lg font-semibold text-gray-900">{stakeholder.name}</h3>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${engagement.color}`}>
                        {engagement.text} Engagement
                      </span>
                      <button
                        onClick={() => handleGenerateMessage(stakeholder)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <EnvelopeIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      <span>{stakeholder.email}</span>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      <span>{stakeholder.phone}</span>
                    </div>
                    {stakeholder.organization && (
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                        <span>{stakeholder.organization}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <ChartBarIcon className="h-4 w-4 mr-2" />
                      <span>Engagement Score: {stakeholder.engagement_score}%</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span>Last Contact: {new Date(stakeholder.last_contact).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-2" />
                      <span>Role: {stakeholder.role}</span>
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
                {selectedStakeholder && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900">Selected Stakeholder</h3>
                    <p className="text-sm text-gray-600">{selectedStakeholder.name}</p>
                    <p className="text-sm text-gray-600">{selectedStakeholder.email}</p>
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
              disabled={!selectedStakeholder || !aiMessage || isGeneratingMessage}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Email
            </button>
          </div>
        </div>
      </div>

      {/* Add Stakeholder Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-lg rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Add New Stakeholder
            </Dialog.Title>
            <form onSubmit={handleCreateStakeholder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Stakeholder['type'] })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="individual">Individual</option>
                  <option value="organization">Organization</option>
                  <option value="government">Government</option>
                  <option value="media">Media</option>
                  <option value="community">Community</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Organization</label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Engagement Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.engagement_score}
                  onChange={(e) => setFormData({ ...formData, engagement_score: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Contact</label>
                <input
                  type="date"
                  value={formData.last_contact}
                  onChange={(e) => setFormData({ ...formData, last_contact: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Stakeholder'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 