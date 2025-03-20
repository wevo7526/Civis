'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ImpactMetrics } from '@/app/components/analytics/ImpactMetrics';
import { Event } from '@/lib/types';

export default function AnalyticsContent() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Not authenticated');
        }

        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (eventsError) {
          throw new Error(`Error fetching events: ${eventsError.message}`);
        }

        if (!eventsData || eventsData.length === 0) {
          // Create sample events if none exist
          const sampleEvents = [
            {
              name: 'Community Cleanup Day',
              description: 'Annual community cleanup event',
              date: new Date().toISOString(),
              location: 'City Park',
              type: 'volunteer' as const,
              status: 'active' as const,
              max_volunteers: 50,
              volunteer_ids: [],
              volunteer_hours: {},
              user_id: user.id,
              id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              budget: 500,
              amount_raised: 750,
              fundraising_goal: 1000
            },
            {
              name: 'Summer Fundraiser Gala',
              description: 'Annual fundraising gala',
              date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              location: 'Grand Hotel',
              type: 'fundraiser' as const,
              status: 'planned' as const,
              max_volunteers: 20,
              volunteer_ids: [],
              volunteer_hours: {},
              user_id: user.id,
              id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              budget: 5000,
              amount_raised: 2500,
              fundraising_goal: 10000
            },
            {
              name: 'Youth Mentorship Program',
              description: 'Weekly youth mentorship sessions',
              date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
              location: 'Community Center',
              type: 'community' as const,
              status: 'active' as const,
              max_volunteers: 15,
              volunteer_ids: [],
              volunteer_hours: {},
              user_id: user.id,
              id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              budget: 2000,
              amount_raised: 1500,
              fundraising_goal: 3000
            }
          ] as Event[];

          const { error: insertError } = await supabase
            .from('events')
            .insert(sampleEvents);

          if (insertError) {
            throw new Error(`Error creating sample events: ${insertError.message}`);
          }

          setEvents(sampleEvents);
          return;
        }

        setEvents(eventsData);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  if (loading) {
    return null; // Let the Suspense fallback handle loading state
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-500">Track event performance and impact metrics</p>
      </div>

      <ImpactMetrics events={events} />
    </div>
  );
} 