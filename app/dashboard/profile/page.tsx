'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Profile } from '@/lib/profileService';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    let mounted = true;

    const getProfile = async () => {
      try {
        // Check authentication first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError) {
          console.error('Session error:', sessionError);
          router.push('/');
          return;
        }

        if (!session?.user) {
          console.log('No authenticated session, redirecting...');
          router.push('/');
          return;
        }

        // Get profile with a single query
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!mounted) return;

        if (!data) {
          // Profile doesn't exist, create it
          try {
            const defaultProfile = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: '',
              bio: '',
              role: '',
              location: '',
              interests: [],
              skills: [],
              goals: [],
              website_url: '',
              linkedin_url: '',
              github_url: '',
              preferred_communication: '',
              availability: '',
              onboarding_completed: false,
              onboarding_step: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_active: new Date().toISOString()
            };

            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .upsert(defaultProfile)
              .select('*')
              .single();

            if (!mounted) return;

            if (insertError) {
              console.error('Profile creation error:', insertError);
              setError('Failed to create profile');
              return;
            }

            if (newProfile) {
              setProfile(newProfile);
              setFormData(newProfile);
            } else {
              throw new Error('Failed to create profile: No data returned');
            }
          } catch (createErr) {
            console.error('Profile creation error:', createErr);
            setError('Failed to create profile');
            return;
          }
        } else {
          // Profile exists
          setProfile(data);
          setFormData(data);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getProfile();

    // Set up realtime subscription for profile updates
    const profileSubscription = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          if (payload.new && mounted) {
            setProfile(payload.new as Profile);
            setFormData(payload.new as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      profileSubscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setError('No authenticated session');
        return;
      }

      // Remove any undefined or null values
      const updatedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined && value !== null)
      );

      // Ensure arrays are initialized
      if (!updatedData.interests) updatedData.interests = [];
      if (!updatedData.skills) updatedData.skills = [];
      if (!updatedData.goals) updatedData.goals = [];

      // Add updated timestamp
      updatedData.updated_at = new Date().toISOString();
      updatedData.last_active = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        setError('Failed to update profile');
        return;
      }

      // Fetch the updated profile to ensure we have the latest data
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching updated profile:', fetchError);
        setError('Profile updated but failed to fetch latest data');
        return;
      }

      setProfile(updatedProfile);
      setFormData(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      console.error('Unexpected error during profile update:', err);
      setError('An unexpected error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayInputChange = (name: keyof Profile, value: string) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      [name]: arrayValue
    }));
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => router.refresh()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio || ''}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="interests" className="block text-sm font-medium text-gray-700">
                Interests (comma-separated)
              </label>
              <input
                type="text"
                id="interests"
                name="interests"
                value={formData.interests?.join(', ') || ''}
                onChange={(e) => handleArrayInputChange('interests', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                id="skills"
                name="skills"
                value={formData.skills?.join(', ') || ''}
                onChange={(e) => handleArrayInputChange('skills', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="goals" className="block text-sm font-medium text-gray-700">
                Goals (comma-separated)
              </label>
              <input
                type="text"
                id="goals"
                name="goals"
                value={formData.goals?.join(', ') || ''}
                onChange={(e) => handleArrayInputChange('goals', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="website_url" className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                type="url"
                id="website_url"
                name="website_url"
                value={formData.website_url || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://"
              />
            </div>

            <div>
              <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700">
                LinkedIn URL
              </label>
              <input
                type="url"
                id="linkedin_url"
                name="linkedin_url"
                value={formData.linkedin_url || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            <div>
              <label htmlFor="github_url" className="block text-sm font-medium text-gray-700">
                GitHub URL
              </label>
              <input
                type="url"
                id="github_url"
                name="github_url"
                value={formData.github_url || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://github.com/..."
              />
            </div>

            <div>
              <label htmlFor="preferred_communication" className="block text-sm font-medium text-gray-700">
                Preferred Communication
              </label>
              <select
                id="preferred_communication"
                name="preferred_communication"
                value={formData.preferred_communication || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select preference</option>
                <option value="Email">Email</option>
                <option value="Phone">Phone</option>
                <option value="Slack">Slack</option>
                <option value="Teams">Microsoft Teams</option>
              </select>
            </div>

            <div>
              <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
                Availability
              </label>
              <select
                id="availability"
                name="availability"
                value={formData.availability || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select availability</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Flexible">Flexible</option>
                <option value="Limited">Limited</option>
              </select>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
} 