'use client';

import { useState, useEffect } from 'react';
import { donorService, Donor } from '@/app/lib/donorService';
import { aiService } from '@/app/lib/aiService';
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import DonorForm from '@/app/components/DonorForm';
import DonorCard from '@/app/components/DonorCard';
import AIInsightsPanel from '@/app/components/AIInsightsPanel';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type DonorFormData = Omit<Donor, 'id' | 'created_at' | 'updated_at' | 'user_id'>;

export default function DonorManagement() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [insights, setInsights] = useState<Array<{ title: string; content: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkUser();
    loadDonors();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    }
  };

  const loadDonors = async () => {
    try {
      setLoading(true);
      const data = await donorService.getDonors();
      setDonors(data);
    } catch (err) {
      setError('Failed to load donors');
      console.error('Error loading donors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMessage = async (donor: Donor) => {
    try {
      setGeneratingMessage(true);
      setSelectedDonor(donor);
      const message = await aiService.generateOutreachMessage(donor);
      setInsights([{
        title: 'Outreach Message',
        content: message
      }]);
    } catch (err) {
      setError('Failed to generate message');
      console.error('Error generating message:', err);
    } finally {
      setGeneratingMessage(false);
    }
  };

  const handleAnalyzeEngagement = async (donor: Donor) => {
    try {
      setSelectedDonor(donor);
      const analysis = await aiService.analyzeDonorEngagement(donor);
      setInsights([{
        title: 'Engagement Analysis',
        content: analysis
      }]);
    } catch (err) {
      setError('Failed to analyze engagement');
      console.error('Error analyzing engagement:', err);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const report = await aiService.generateDonorReport(donors);
      setInsights([{
        title: 'Donor Report',
        content: report
      }]);
    } catch (err) {
      setError('Failed to generate report');
      console.error('Error generating report:', err);
    }
  };

  const handleAddDonor = async (donor: DonorFormData) => {
    try {
      const newDonor = await donorService.addDonor(donor);
      setDonors([newDonor, ...donors]);
      setShowForm(false);
    } catch (err) {
      setError('Failed to add donor');
      console.error('Error adding donor:', err);
    }
  };

  const handleUpdateDonor = async (id: string, updates: Partial<Donor>) => {
    try {
      const updatedDonor = await donorService.updateDonor(id, updates);
      setDonors(donors.map(d => d.id === id ? updatedDonor : d));
      setShowForm(false);
      setEditingDonor(null);
    } catch (err) {
      setError('Failed to update donor');
      console.error('Error updating donor:', err);
    }
  };

  const handleDeleteDonor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this donor?')) return;
    
    try {
      await donorService.deleteDonor(id);
      setDonors(donors.filter(d => d.id !== id));
    } catch (err) {
      setError('Failed to delete donor');
      console.error('Error deleting donor:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Donor Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setEditingDonor(null);
              setShowForm(true);
            }}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Donor
          </button>
          <button
            onClick={handleGenerateReport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingDonor ? 'Edit Donor' : 'Add New Donor'}
          </h2>
          <DonorForm
            donor={editingDonor || undefined}
            onSubmit={editingDonor ? (updates) => handleUpdateDonor(editingDonor.id, updates) : handleAddDonor}
            onCancel={() => {
              setShowForm(false);
              setEditingDonor(null);
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Donor List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Donors</h2>
              <div className="space-y-4">
                {donors.map((donor) => (
                  <DonorCard
                    key={donor.id}
                    donor={donor}
                    onEdit={(donor) => {
                      setEditingDonor(donor);
                      setShowForm(true);
                    }}
                    onGenerateMessage={handleGenerateMessage}
                    onAnalyze={handleAnalyzeEngagement}
                    onDelete={handleDeleteDonor}
                    generatingMessage={generatingMessage}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="lg:col-span-1">
          <AIInsightsPanel
            insights={insights}
            className="sticky top-8"
          />
        </div>
      </div>
    </div>
  );
} 