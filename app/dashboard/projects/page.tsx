'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, ChartBarIcon, UserGroupIcon, CalendarIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { aiService } from '@/app/lib/aiService';
import { projectService, Project } from '@/app/lib/projectService';
import ProjectForm from '@/app/components/ProjectForm';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data);
      generateAIInsights(data);
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async (projectData: Project[]) => {
    try {
      // Generate AI insights for each project
      const updatedProjects = await Promise.all(
        projectData.map(async (project) => {
          const report = await aiService.generateDonorReport([{
            id: project.id,
            name: project.name,
            email: '',
            last_donation: project.created_at,
            amount: project.budget,
            engagement: 'high',
            last_contact: project.updated_at,
            created_at: project.created_at,
            updated_at: project.updated_at
          }]);

          return {
            ...project,
            aiInsights: {
              recommendations: [
                "Optimize resource allocation based on impact metrics",
                "Consider expanding volunteer base for better community reach",
                "Implement feedback mechanisms for program improvement"
              ],
              risks: [
                "Budget constraints may affect program expansion",
                "Volunteer retention needs attention",
                "Community engagement levels below target"
              ],
              opportunities: [
                "Potential for corporate partnerships",
                "Expand program to additional communities",
                "Develop digital learning resources"
              ]
            }
          };
        })
      );
      setProjects(updatedProjects);
    } catch (err) {
      console.error('Failed to generate AI insights:', err);
    }
  };

  const handleCreateProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'aiInsights'>) => {
    try {
      await projectService.createProject(project);
      await loadProjects();
      setShowNewProjectForm(false);
    } catch (err) {
      console.error('Failed to create project:', err);
      throw err;
    }
  };

  const handleUpdateProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'aiInsights'>) => {
    if (!selectedProject) return;
    
    try {
      await projectService.updateProject(selectedProject.id, project);
      await loadProjects();
      setSelectedProject(null);
    } catch (err) {
      console.error('Failed to update project:', err);
      throw err;
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
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => setShowNewProjectForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Project
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{project.name}</h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  project.status === 'active' ? 'bg-green-100 text-green-800' :
                  project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                  project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4">{project.description}</p>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span>{new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  <span>Budget: ${project.budget.toLocaleString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <UserGroupIcon className="h-4 w-4 mr-2" />
                  <span>Team: {project.team_size} members</span>
                </div>
              </div>

              {/* Impact Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Impact Progress</span>
                  <span className="font-medium">{project.impact_current} / {project.impact_target} {project.impact_metric}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(project.impact_current / project.impact_target) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* AI Insights */}
              {project.aiInsights && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center text-sm text-purple-600 mb-2">
                    <SparklesIcon className="h-4 w-4 mr-1" />
                    <span>AI Insights</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Key Recommendations</h4>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {project.aiInsights.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Risks</h4>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {project.aiInsights.risks.map((risk, index) => (
                          <li key={index}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Project Form Modal */}
      {(showNewProjectForm || selectedProject) && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-semibold mb-4">
              {selectedProject ? 'Edit Project' : 'Create New Project'}
            </h2>
            <ProjectForm
              project={selectedProject || undefined}
              onSubmit={selectedProject ? handleUpdateProject : handleCreateProject}
              onCancel={() => {
                setShowNewProjectForm(false);
                setSelectedProject(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 