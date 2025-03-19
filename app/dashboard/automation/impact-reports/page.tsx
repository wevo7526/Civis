'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@headlessui/react';

interface ImpactReport {
  id: string;
  name: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  status: 'active' | 'inactive';
  schedule: string;
  template: string;
  metrics: string[];
  recipients: string[];
  lastGenerated?: string;
  nextGeneration?: string;
  created_at: string;
  updated_at: string;
}

export default function ImpactReports() {
  const [reports, setReports] = useState<ImpactReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ImpactReport | null>(null);
  const [newReport, setNewReport] = useState<Partial<ImpactReport>>({
    name: '',
    type: 'monthly',
    schedule: 'monthly',
    template: '',
    metrics: [],
    recipients: [],
  });
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchReportStatus();
  }, []);

  const fetchReportStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: workflows, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'impact-reports');

      if (error) throw error;

      // Ensure arrays are always defined
      const processedWorkflows = workflows?.map(workflow => ({
        ...workflow,
        metrics: workflow.config?.metrics || [],
        recipients: workflow.config?.recipients || [],
      })) || [];

      setReports(processedWorkflows);
    } catch (error) {
      console.error('Error fetching report status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: workflow, error } = await supabase
        .from('automation_workflows')
        .insert({
          user_id: user.id,
          type: 'impact-reports',
          status: 'inactive',
          config: newReport,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setReports(prev => [...prev, workflow]);
      setIsCreateModalOpen(false);
      setNewReport({
        name: '',
        type: 'monthly',
        schedule: 'monthly',
        template: '',
        metrics: [],
        recipients: [],
      });
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedReport) return;

    try {
      const { error } = await supabase
        .from('automation_workflows')
        .update({
          config: selectedReport,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      setReports(prev =>
        prev.map(r => (r.id === selectedReport.id ? selectedReport : r))
      );
      setIsEditModalOpen(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  const handleToggleStatus = async (reportId: string) => {
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      const newStatus = report.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('automation_workflows')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev =>
        prev.map(r => (r.id === reportId ? { ...r, status: newStatus } : r))
      );

      if (newStatus === 'active') {
        const response = await fetch('/api/automation/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflowId: reportId }),
        });

        if (!response.ok) throw new Error('Failed to start workflow');
      }
    } catch (error) {
      console.error('Error toggling report status:', error);
    }
  };

  const handleDelete = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handlePreview = async (report: ImpactReport) => {
    try {
      const response = await fetch('/api/automation/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: report.id }),
      });

      if (!response.ok) throw new Error('Failed to generate preview');
      
      const data = await response.json();
      // Show preview in a modal or new window
      console.log('Preview:', data);
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Impact Reports</h1>
          <p className="text-gray-500">Configure automated impact reports and analytics</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create New</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <ChartBarIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{report.name}</h3>
                  <p className="text-sm text-gray-500">
                    {report.type === 'monthly'
                      ? 'Monthly Report'
                      : report.type === 'quarterly'
                      ? 'Quarterly Report'
                      : report.type === 'annual'
                      ? 'Annual Report'
                      : 'Custom Report'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePreview(report)}
                  className="p-2 text-gray-400 hover:text-gray-500"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedReport(report);
                    setIsEditModalOpen(true);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-500"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(report.id)}
                  className="p-2 text-red-400 hover:text-red-500"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleToggleStatus(report.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    report.status === 'active'
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {report.status === 'active' ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Schedule</Label>
                  <Select
                    value={report.schedule}
                    onValueChange={(value) => {
                      setSelectedReport(prev => prev ? { ...prev, schedule: value } : null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Recipients</Label>
                  <Select
                    value={(report.recipients || []).join(',')}
                    onValueChange={(value) => {
                      setSelectedReport(prev => prev ? { ...prev, recipients: value.split(',') } : null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_donors">All Donors</SelectItem>
                      <SelectItem value="board_members">Board Members</SelectItem>
                      <SelectItem value="major_donors">Major Donors</SelectItem>
                      <SelectItem value="stakeholders">Stakeholders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Metrics to Include</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Total Donations', 'Number of Donors', 'Average Donation', 'Program Impact', 'Success Stories'].map((metric) => (
                    <label key={metric} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={report.metrics.includes(metric)}
                        onChange={(e) => {
                          const newMetrics = e.target.checked
                            ? [...report.metrics, metric]
                            : report.metrics.filter(m => m !== metric);
                          setSelectedReport(prev => prev ? { ...prev, metrics: newMetrics } : null);
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{metric}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Report Template</Label>
                <Textarea
                  value={report.template}
                  onChange={(e) => {
                    setSelectedReport(prev => prev ? { ...prev, template: e.target.value } : null);
                  }}
                  rows={3}
                  placeholder="Use {metric} syntax for dynamic content"
                />
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {report.lastGenerated && (
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Last generated: {new Date(report.lastGenerated).toLocaleDateString()}</span>
                  </div>
                )}
                {report.nextGeneration && (
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Next generation: {new Date(report.nextGeneration).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-lg bg-white rounded-xl shadow-lg p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Create New Impact Report
            </Dialog.Title>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newReport.name}
                  onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter report name"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={newReport.type}
                  onValueChange={(value) => setNewReport(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly Report</SelectItem>
                    <SelectItem value="quarterly">Quarterly Report</SelectItem>
                    <SelectItem value="annual">Annual Report</SelectItem>
                    <SelectItem value="custom">Custom Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Schedule</Label>
                <Select
                  value={newReport.schedule}
                  onValueChange={(value) => setNewReport(prev => ({ ...prev, schedule: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Template</Label>
                <Textarea
                  value={newReport.template}
                  onChange={(e) => setNewReport(prev => ({ ...prev, template: e.target.value }))}
                  rows={3}
                  placeholder="Use {metric} syntax for dynamic content"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate}>
                Create
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-lg bg-white rounded-xl shadow-lg p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Edit Impact Report
            </Dialog.Title>
            {selectedReport && (
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={selectedReport.name}
                    onChange={(e) => setSelectedReport(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label>Schedule</Label>
                  <Select
                    value={selectedReport.schedule}
                    onValueChange={(value) => setSelectedReport(prev => prev ? { ...prev, schedule: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Template</Label>
                  <Textarea
                    value={selectedReport.template}
                    onChange={(e) => setSelectedReport(prev => prev ? { ...prev, template: e.target.value } : null)}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate}>
                Save Changes
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 