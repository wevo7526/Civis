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
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  UserGroupIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@headlessui/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { workflowTemplates } from '@/lib/workflowTemplates';

interface DonorCommunication {
  id: string;
  name: string;
  type: 'thank_you' | 'custom';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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

  const filteredCommunications = communications.filter(comm => {
    if (!comm) return false;
    
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = comm.name?.toLowerCase().includes(searchLower) || false;
    const templateMatch = comm.template?.toLowerCase().includes(searchLower) || false;
    const matchesSearch = nameMatch || templateMatch;
    
    const matchesCategory = selectedCategory === 'all' || comm.type === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Donor Communications</h1>
          <p className="mt-2 text-gray-600">
            Manage automated thank you notes and donor outreach
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Communication
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search communications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white shadow-sm border-0"
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full bg-white shadow-sm border-0">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="thank_you">Thank You Notes</SelectItem>
              <SelectItem value="custom">Custom Messages</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Communications</CardTitle>
            <DocumentDuplicateIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communications.length}</div>
            <p className="text-xs text-muted-foreground">
              {communications.filter(c => c.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">
              Average delivery success rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recipients</CardTitle>
            <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {communications.reduce((sum, c) => sum + (c.recipients?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total recipients across all communications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Communication Templates */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-8 border-0">
        <h2 className="text-lg font-semibold mb-4">Communication Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflowTemplates
            .filter(template => template.category === 'communications')
            .map((template) => (
              <div key={template.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border-0">
                <h3 className="font-medium mb-2">{template.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {template.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-0 bg-gray-100">{template.category}</Badge>
                  <Button variant="outline" size="sm" className="border-0">
                    Use Template
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Active Communications */}
      <div className="bg-white shadow-sm rounded-lg p-6 border-0">
        <h2 className="text-lg font-semibold mb-4">Active Communications</h2>
        <div className="space-y-4">
          {filteredCommunications.map((comm) => (
            <div
              key={comm.id}
              className="flex items-center justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-0"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <EnvelopeIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{comm.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {comm.type === 'thank_you' ? 'Thank You Note' : 'Custom Communication'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`comm-${comm.id}`}
                    checked={comm.status === 'active'}
                    onCheckedChange={(checked) => handleToggleStatus(comm.id)}
                  />
                  <Label htmlFor={`comm-${comm.id}`}>
                    {comm.status === 'active' ? 'Active' : 'Inactive'}
                  </Label>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handlePreview(comm)} className="border-0">
                  <EyeIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  setSelectedComm(comm);
                  setIsEditModalOpen(true);
                }} className="border-0">
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(comm.id)} className="border-0">
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-lg bg-white rounded-xl shadow-lg p-6 border-0">
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
                  className="shadow-sm border-0"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={newComm.type}
                  onValueChange={(value) => setNewComm(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger className="shadow-sm border-0">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thank_you">Thank You Note</SelectItem>
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
                  <SelectTrigger className="shadow-sm border-0">
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
                  className="shadow-sm border-0"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="border-0"
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
          <Dialog.Panel className="mx-auto w-full max-w-lg bg-white rounded-xl shadow-lg p-6 border-0">
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
                    className="shadow-sm border-0"
                  />
                </div>
                <div>
                  <Label>Schedule</Label>
                  <Select
                    value={selectedComm.schedule}
                    onValueChange={(value) => setSelectedComm(prev => prev ? { ...prev, schedule: value } : null)}
                  >
                    <SelectTrigger className="shadow-sm border-0">
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
                    className="shadow-sm border-0"
                  />
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="border-0"
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