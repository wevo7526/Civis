'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@headlessui/react';

interface DonorCommunication {
  id: string;
  name: string;
  type: 'thank_you' | 'impact_update' | 'custom';
  status: 'active' | 'inactive';
  schedule: string;
  template: string;
  recipients: string[];
  variables: string[];
  lastSent?: string;
  nextSend?: string;
  created_at: string;
  updated_at: string;
}

export default function DonorCommunications() {
  const [communications, setCommunications] = useState<DonorCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedComm, setSelectedComm] = useState<DonorCommunication | null>(null);
  const [newComm, setNewComm] = useState<Partial<DonorCommunication>>({
    name: '',
    type: 'thank_you',
    schedule: 'immediate',
    template: '',
    recipients: [],
    variables: [],
  });
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchCommunicationStatus();
  }, []);

  const fetchCommunicationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: workflows, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'donor-communications');

      if (error) throw error;

      // Ensure recipients is always an array
      const processedWorkflows = workflows?.map(workflow => ({
        ...workflow,
        recipients: workflow.config?.recipients || [],
        variables: workflow.config?.variables || [],
      })) || [];

      setCommunications(processedWorkflows);
    } catch (error) {
      console.error('Error fetching communication status:', error);
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
          type: 'donor-communications',
          status: 'inactive',
          config: newComm,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setCommunications(prev => [...prev, workflow]);
      setIsCreateModalOpen(false);
      setNewComm({
        name: '',
        type: 'thank_you',
        schedule: 'immediate',
        template: '',
        recipients: [],
        variables: [],
      });
    } catch (error) {
      console.error('Error creating communication:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedComm) return;

    try {
      const { error } = await supabase
        .from('automation_workflows')
        .update({
          config: selectedComm,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedComm.id);

      if (error) throw error;

      setCommunications(prev =>
        prev.map(c => (c.id === selectedComm.id ? selectedComm : c))
      );
      setIsEditModalOpen(false);
      setSelectedComm(null);
    } catch (error) {
      console.error('Error updating communication:', error);
    }
  };

  const handleToggleStatus = async (commId: string) => {
    try {
      const comm = communications.find(c => c.id === commId);
      if (!comm) return;

      const newStatus = comm.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('automation_workflows')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commId);

      if (error) throw error;

      setCommunications(prev =>
        prev.map(c => (c.id === commId ? { ...c, status: newStatus } : c))
      );

      if (newStatus === 'active') {
        const response = await fetch('/api/automation/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflowId: commId }),
        });

        if (!response.ok) throw new Error('Failed to start workflow');
      }
    } catch (error) {
      console.error('Error toggling communication status:', error);
    }
  };

  const handleDelete = async (commId: string) => {
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .delete()
        .eq('id', commId);

      if (error) throw error;

      setCommunications(prev => prev.filter(c => c.id !== commId));
    } catch (error) {
      console.error('Error deleting communication:', error);
    }
  };

  const handlePreview = async (comm: DonorCommunication) => {
    try {
      const response = await fetch('/api/automation/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: comm.id }),
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
          <h1 className="text-2xl font-semibold text-gray-900">Donor Communications</h1>
          <p className="text-gray-500">Configure automated thank you notes and impact updates</p>
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
        {communications.map((comm) => (
          <div
            key={comm.id}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <EnvelopeIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{comm.name}</h3>
                  <p className="text-sm text-gray-500">
                    {comm.type === 'thank_you'
                      ? 'Thank You Note'
                      : comm.type === 'impact_update'
                      ? 'Impact Update'
                      : 'Custom Communication'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePreview(comm)}
                  className="p-2 text-gray-400 hover:text-gray-500"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedComm(comm);
                    setIsEditModalOpen(true);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-500"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(comm.id)}
                  className="p-2 text-red-400 hover:text-red-500"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleToggleStatus(comm.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    comm.status === 'active'
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {comm.status === 'active' ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Schedule</Label>
                  <Select
                    value={comm.schedule}
                    onValueChange={(value) => {
                      setSelectedComm(prev => prev ? { ...prev, schedule: value } : null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Send immediately</SelectItem>
                      <SelectItem value="daily">Daily digest</SelectItem>
                      <SelectItem value="weekly">Weekly digest</SelectItem>
                      <SelectItem value="monthly">Monthly digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Recipients</Label>
                  <Select
                    value={(comm.recipients || []).join(',')}
                    onValueChange={(value) => {
                      setSelectedComm(prev => prev ? { ...prev, recipients: value.split(',') } : null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_donors">All Donors</SelectItem>
                      <SelectItem value="recent_donors">Recent Donors</SelectItem>
                      <SelectItem value="major_donors">Major Donors</SelectItem>
                      <SelectItem value="monthly_donors">Monthly Donors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Message Template</Label>
                <Textarea
                  value={comm.template}
                  onChange={(e) => {
                    setSelectedComm(prev => prev ? { ...prev, template: e.target.value } : null);
                  }}
                  rows={3}
                  placeholder="Use {variable} syntax for dynamic content"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Available variables: {comm.variables.join(', ')}
                </p>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {comm.lastSent && (
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Last sent: {new Date(comm.lastSent).toLocaleDateString()}</span>
                  </div>
                )}
                {comm.nextSend && (
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Next send: {new Date(comm.nextSend).toLocaleDateString()}</span>
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
              Create New Communication
            </Dialog.Title>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newComm.name}
                  onChange={(e) => setNewComm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter communication name"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={newComm.type}
                  onValueChange={(value) => setNewComm(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thank_you">Thank You Note</SelectItem>
                    <SelectItem value="impact_update">Impact Update</SelectItem>
                    <SelectItem value="custom">Custom Communication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Schedule</Label>
                <Select
                  value={newComm.schedule}
                  onValueChange={(value) => setNewComm(prev => ({ ...prev, schedule: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Send immediately</SelectItem>
                    <SelectItem value="daily">Daily digest</SelectItem>
                    <SelectItem value="weekly">Weekly digest</SelectItem>
                    <SelectItem value="monthly">Monthly digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Template</Label>
                <Textarea
                  value={newComm.template}
                  onChange={(e) => setNewComm(prev => ({ ...prev, template: e.target.value }))}
                  rows={3}
                  placeholder="Use {variable} syntax for dynamic content"
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
              Edit Communication
            </Dialog.Title>
            {selectedComm && (
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={selectedComm.name}
                    onChange={(e) => setSelectedComm(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label>Schedule</Label>
                  <Select
                    value={selectedComm.schedule}
                    onValueChange={(value) => setSelectedComm(prev => prev ? { ...prev, schedule: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Send immediately</SelectItem>
                      <SelectItem value="daily">Daily digest</SelectItem>
                      <SelectItem value="weekly">Weekly digest</SelectItem>
                      <SelectItem value="monthly">Monthly digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Template</Label>
                  <Textarea
                    value={selectedComm.template}
                    onChange={(e) => setSelectedComm(prev => prev ? { ...prev, template: e.target.value } : null)}
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