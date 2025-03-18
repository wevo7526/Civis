'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams } from 'next/navigation';
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  SparklesIcon, 
  UserGroupIcon, 
  CalendarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Project } from '@/lib/projectService';
import { aiService } from '@/lib/aiService';

export default function ProjectDetails() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [aiContent, setAiContent] = useState<{
    grantProposal: string | null;
    fundraisingStrategy: string | null;
    insights: string | null;
  }>({
    grantProposal: null,
    fundraisingStrategy: null,
    insights: null,
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setProject(data);
      generateAiContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project');
    } finally {
      setLoading(false);
    }
  };

  const generateAiContent = async (projectData: Project) => {
    try {
      // Generate grant proposal
      const grantProposal = await aiService.generateGrantProposal({
        projectName: projectData.name,
        projectDescription: projectData.description,
        targetAmount: projectData.budget,
      });

      // Generate fundraising strategy
      const fundraisingStrategy = await aiService.generateFundraisingStrategy({
        organizationName: projectData.name,
        organizationType: 'nonprofit',
        targetAmount: projectData.budget,
        timeframe: projectData.end_date ? new Date(projectData.end_date).toLocaleDateString() : 'ongoing',
        currentDonors: 0, // This could be fetched from donors table
      });

      // Generate project insights
      const insights = await aiService.analyzeProjects([projectData]);

      setAiContent({
        grantProposal,
        fundraisingStrategy,
        insights,
      });
    } catch (err) {
      console.error('Failed to generate AI content:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
          <p className="mt-2 text-gray-500">The project you're looking for doesn't exist or has been deleted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Projects
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="mt-1 text-sm text-gray-500">{project.description}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            project.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
            project.status === 'active' ? 'bg-green-100 text-green-800' :
            project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {project.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('grant')}
            className={`${
              activeTab === 'grant'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Grant Proposal
          </button>
          <button
            onClick={() => setActiveTab('fundraising')}
            className={`${
              activeTab === 'fundraising'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Fundraising Strategy
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`${
              activeTab === 'insights'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            AI Insights
          </button>
        </nav>
      </div>

      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Budget</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">${project.budget.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Timeline</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Status</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 capitalize">{project.status.replace('_', ' ')}</p>
            </div>
          </div>
        )}

        {activeTab === 'grant' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Grant Proposal</h3>
            </div>
            {aiContent.grantProposal ? (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">{aiContent.grantProposal}</pre>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Generating grant proposal...</p>
            )}
          </div>
        )}

        {activeTab === 'fundraising' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Fundraising Strategy</h3>
            </div>
            {aiContent.fundraisingStrategy ? (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">{aiContent.fundraisingStrategy}</pre>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Generating fundraising strategy...</p>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <SparklesIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">AI Insights</h3>
            </div>
            {aiContent.insights ? (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">{aiContent.insights}</pre>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Generating insights...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 