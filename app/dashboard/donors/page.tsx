'use client';

import { useState, useEffect } from 'react';
import { donorService, Donor } from '@/app/lib/donorService';
import { aiService } from '@/app/lib/aiService';
import { UserCircleIcon, EnvelopeIcon, ChartBarIcon, DocumentTextIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import DonorForm from '@/app/components/DonorForm';

export default function DonorManagement() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [outreachMessage, setOutreachMessage] = useState('');
  const [engagementAnalysis, setEngagementAnalysis] = useState('');
  const [donorReport, setDonorReport] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);

  useEffect(() => {
    loadDonors();
  }, []);

  const loadDonors = async () => {
    try {
      const data = await donorService.getDonors();
      setDonors(data);
    } catch (err) {
      setError('Failed to load donors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOutreach = async (donor: Donor) => {
    try {
      setSelectedDonor(donor);
      const message = await aiService.generateOutreachMessage(donor);
      setOutreachMessage(message);
    } catch (err) {
      setError('Failed to generate outreach message');
      console.error(err);
    }
  };

  const handleAnalyzeEngagement = async (donor: Donor) => {
    try {
      setSelectedDonor(donor);
      const analysis = await aiService.analyzeDonorEngagement(donor);
      setEngagementAnalysis(analysis);
    } catch (err) {
      setError('Failed to analyze engagement');
      console.error(err);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const report = await aiService.generateDonorReport(donors);
      setDonorReport(report);
    } catch (err) {
      setError('Failed to generate report');
      console.error(err);
    }
  };

  const handleAddDonor = async (donorData: Omit<Donor, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await donorService.addDonor(donorData);
      await loadDonors();
      setShowForm(false);
      setError('');
    } catch (err) {
      setError('Failed to add donor');
      console.error(err);
    }
  };

  const handleUpdateDonor = async (donorData: Omit<Donor, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingDonor) return;
    
    try {
      await donorService.updateDonor(editingDonor.id, donorData);
      await loadDonors();
      setEditingDonor(null);
      setError('');
    } catch (err) {
      setError('Failed to update donor');
      console.error(err);
    }
  };

  const handleDeleteDonor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this donor?')) return;
    
    try {
      await donorService.deleteDonor(id);
      await loadDonors();
      setError('');
    } catch (err) {
      setError('Failed to delete donor');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingDonor ? 'Edit Donor' : 'Add New Donor'}
          </h2>
          <DonorForm
            donor={editingDonor || undefined}
            onSubmit={editingDonor ? handleUpdateDonor : handleAddDonor}
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
                  <div
                    key={donor.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <UserCircleIcon className="h-10 w-10 text-gray-400 mr-3" />
                        <div>
                          <h3 className="font-medium">{donor.name}</h3>
                          <p className="text-sm text-gray-500">{donor.email}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingDonor(donor);
                            setShowForm(true);
                          }}
                          className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleGenerateOutreach(donor)}
                          className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          Outreach
                        </button>
                        <button
                          onClick={() => handleAnalyzeEngagement(donor)}
                          className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          <ChartBarIcon className="h-4 w-4 mr-1" />
                          Analyze
                        </button>
                        <button
                          onClick={() => handleDeleteDonor(donor.id)}
                          className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Last Donation:</span>
                        <span className="ml-1">{new Date(donor.last_donation).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <span className="ml-1">${donor.amount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Engagement:</span>
                        <span className={`ml-1 capitalize ${
                          donor.engagement === 'high' ? 'text-green-600' :
                          donor.engagement === 'medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {donor.engagement}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow sticky top-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">AI Insights</h2>
              {selectedDonor && (
                <div className="space-y-6">
                  {outreachMessage && (
                    <div>
                      <h3 className="font-medium mb-2">Outreach Message</h3>
                      <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                        {outreachMessage}
                      </div>
                    </div>
                  )}
                  {engagementAnalysis && (
                    <div>
                      <h3 className="font-medium mb-2">Engagement Analysis</h3>
                      <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                        {engagementAnalysis}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {donorReport && (
                <div>
                  <h3 className="font-medium mb-2">Donor Report</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                    {donorReport}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 