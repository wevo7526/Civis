'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Donor, Project, Event } from '@/app/lib/types';
import { aiService } from '@/app/lib/aiService';

export default function AIInsights() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<{
    donorInsights: string | null;
    projectInsights: string | null;
    eventInsights: string | null;
    fundraisingInsights: string | null;
  }>({
    donorInsights: null,
    projectInsights: null,
    eventInsights: null,
    fundraisingInsights: null,
  });
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    generateInsights();
  }, []);

  const generateInsights = async () => {
    try {
      // Fetch data from all relevant tables
      const [donorsResponse, projectsResponse, eventsResponse] = await Promise.all([
        supabase.from('donors').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('events').select('*'),
      ]);

      if (donorsResponse.error) throw donorsResponse.error;
      if (projectsResponse.error) throw projectsResponse.error;
      if (eventsResponse.error) throw eventsResponse.error;

      const donors = donorsResponse.data as Donor[];
      const projects = projectsResponse.data as Project[];
      const events = eventsResponse.data as Event[];

      // Generate insights for each section using aiService
      const [donorInsights, projectInsights, eventInsights, fundraisingInsights] = await Promise.all([
        aiService.analyzeDonors(donors),
        aiService.analyzeProjects(projects),
        aiService.analyzeEvents(events),
        aiService.analyzeFundraising(donors, projects, events),
      ]);

      setInsights({
        donorInsights,
        projectInsights,
        eventInsights,
        fundraisingInsights,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center space-x-3 mb-8">
        <SparklesIcon className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Donor Insights */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Donor Insights</h2>
          {insights.donorInsights ? (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">{insights.donorInsights}</pre>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No donor insights available.</p>
          )}
        </div>

        {/* Project Insights */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Project Insights</h2>
          {insights.projectInsights ? (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">{insights.projectInsights}</pre>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No project insights available.</p>
          )}
        </div>

        {/* Event Insights */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Event Insights</h2>
          {insights.eventInsights ? (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">{insights.eventInsights}</pre>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No event insights available.</p>
          )}
        </div>

        {/* Fundraising Insights */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Fundraising Insights</h2>
          {insights.fundraisingInsights ? (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">{insights.fundraisingInsights}</pre>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No fundraising insights available.</p>
          )}
        </div>
      </div>
    </div>
  );
} 