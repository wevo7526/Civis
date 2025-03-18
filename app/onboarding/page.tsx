'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface OnboardingStep {
  title: string;
  description: string;
  completed: boolean;
}

interface OrganizationProfile {
  name: string;
  mission?: string;
  goals?: string[];
  teamSize?: string;
  location?: string;
  sector?: string;
  website?: string;
}

export default function Onboarding() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<OrganizationProfile>({ name: '' });
  const [onboardingSteps] = useState<OnboardingStep[]>([
    {
      title: 'Welcome & Organization Overview',
      description: 'Tell us about your organization',
      completed: false,
    },
    {
      title: 'Organization Details',
      description: 'Share more about your organization',
      completed: false,
    },
    {
      title: 'Goals & Objectives',
      description: 'Define your organization\'s goals',
      completed: false,
    },
    {
      title: 'Initial Projects',
      description: 'Set up your first project',
      completed: false,
    },
    {
      title: 'Team Setup',
      description: 'Configure your team settings',
      completed: false,
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      role: 'assistant',
      content: 'Welcome to Civis! I\'m here to help you set up your organization profile. Let\'s start by getting to know your organization. What\'s the name of your organization?',
    };
    setMessages([welcomeMessage]);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSkip = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Update profile with onboarding completed
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            onboarding_completed: true,
            onboarding_step: onboardingSteps.length,
            full_name: profile.name || 'My Organization',
            bio: profile.mission || 'Welcome to our organization!',
            goals: profile.goals || ['Get started with our mission'],
            role: 'Admin',
            location: profile.location || 'Not specified',
            timezone: 'UTC',
            availability: 'Flexible',
            preferred_communication: 'Email',
            website_url: profile.website,
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }

        await supabase.auth.refreshSession();
      }
      router.push('/dashboard');
    } catch (err) {
      console.error('Error skipping onboarding:', err);
      setError('Failed to skip onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Update profile based on current step and user input
      if (currentStep === 0 && !profile.name) {
        setProfile(prev => ({ ...prev, name: input.trim() }));
      }

      const response = await fetch('/api/ai/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          currentStep,
          profile, // Send current profile state to API
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Update profile with any extracted information
      if (data.profileUpdates) {
        setProfile(prev => ({ ...prev, ...data.profileUpdates }));
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.stepCompleted) {
        setCurrentStep(prev => prev + 1);
        const updatedSteps = [...onboardingSteps];
        updatedSteps[currentStep].completed = true;

        // If onboarding is complete, save all collected information
        if (currentStep === onboardingSteps.length - 1) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('profiles')
              .update({
                onboarding_completed: true,
                full_name: profile.name,
                bio: profile.mission,
                goals: profile.goals,
                location: profile.location,
                website_url: profile.website,
                role: 'Admin',
                sector: profile.sector,
                team_size: profile.teamSize,
              })
              .eq('id', user.id);
          }
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">
            {profile.name && <span>Setting up: {profile.name}</span>}
          </div>
          <Button
            onClick={handleSkip}
            variant="outline"
            className="text-gray-600 hover:text-gray-900"
            disabled={loading}
          >
            Skip Onboarding
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Progress Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Onboarding Progress</h2>
              <div className="space-y-4">
                {onboardingSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 ${
                      index === currentStep ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        step.completed
                          ? 'bg-green-500 text-white'
                          : index === currentStep
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100'
                      }`}
                    >
                      {step.completed ? '✓' : index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium">{step.title}</h3>
                      <p className="text-sm text-gray-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-12rem)] flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex space-x-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send'}
                  </Button>
                </form>
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 