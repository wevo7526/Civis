'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  EnvelopeIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ChevronUpDownIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { workflowTemplates } from '../../../lib/workflowTemplates';

interface OutreachTemplate {
  id: string;
  name: string;
  description: string;
  type: 'donor' | 'volunteer' | 'both';
  subject: string;
  content: string;
  schedule: 'immediate' | 'daily' | 'weekly' | 'monthly';
  status: 'draft' | 'active' | 'paused';
  created_at: string;
  updated_at: string;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  type: 'donor' | 'volunteer';
  lastContacted?: string | null;
}

export default function OutreachPage() {
  const [templates, setTemplates] = useState<OutreachTemplate[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<OutreachTemplate | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'donor' | 'volunteer'>('all');
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [recipientStats, setRecipientStats] = useState({
    totalDonors: 0,
    totalVolunteers: 0,
    lastEmailSent: null as string | null
  });

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          loadData().catch(err => {
            console.error('Error in loadData:', err);
            setTemplates([]);
          }),
          fetchRecipients().catch(err => {
            console.error('Error in fetchRecipients:', err);
            setRecipients([]);
            setRecipientStats({
              totalDonors: 0,
              totalVolunteers: 0,
              lastEmailSent: null
            });
          })
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      setEditorContent(selectedTemplate.content);
    } else {
      setEditorContent('');
    }
  }, [selectedTemplate]);

  const loadData = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentication error:', authError);
      setTemplates([]);
      setError('Authentication failed. Please sign in again.');
      return;
    }

    if (!user) {
      setTemplates([]);
      setError('Please sign in to view templates');
      return;
    }

    // Load templates
    const { data: templateData, error: templateError } = await supabase
      .from('outreach_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (templateError) {
      console.error('Error fetching templates:', templateError);
      setTemplates([]);
      setError('Failed to load templates');
      return;
    }

    setTemplates(templateData || []);
  };

  const fetchRecipients = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!user) {
        setRecipients([]);
        setRecipientStats({
          totalDonors: 0,
          totalVolunteers: 0,
          lastEmailSent: null
        });
        return;
      }

      // Fetch donors with error handling
      const { data: donors, error: donorError } = await supabase
        .from('donors')
        .select(`
          id,
          name,
          email,
          phone,
          donation_date,
          status,
          notes,
          created_at
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('donation_date', { ascending: false })
        .limit(100);

      if (donorError) {
        console.error('Error fetching donors:', donorError);
        throw donorError;
      }

      // Fetch volunteers with error handling - get unique participants from activities
      const { data: activities, error: volunteerError } = await supabase
        .from('volunteer_activities')
        .select(`
          id,
          title,
          participant_ids,
          start_time,
          status
        `)
        .eq('organizer_id', user.id)
        .order('start_time', { ascending: false });

      if (volunteerError) {
        console.error('Error fetching volunteer activities:', volunteerError);
        throw volunteerError;
      }

      // Get unique participant IDs from all activities
      const uniqueParticipantIds = Array.from(new Set(
        (activities || [])
          .filter(activity => activity.participant_ids)
          .flatMap(activity => activity.participant_ids)
      ));

      // Fetch participant details if there are any participants
      let volunteerRecipients: Recipient[] = [];
      if (uniqueParticipantIds.length > 0) {
        const { data: participants, error: participantError } = await supabase
          .from('profiles')  // Assuming participant details are stored in a profiles table
          .select(`
            id,
            first_name,
            last_name,
            email,
            created_at
          `)
          .in('id', uniqueParticipantIds)
          .limit(100);

        if (participantError) {
          console.error('Error fetching participant details:', participantError);
          throw participantError;
        }

        volunteerRecipients = (participants || []).map(p => ({
          id: p.id,
          name: p.first_name && p.last_name 
            ? `${p.first_name} ${p.last_name}`
            : 'Unknown Volunteer',
          email: p.email || '',
          type: 'volunteer',
          lastContacted: activities
            .filter(a => a.participant_ids?.includes(p.id))
            .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0]
            ?.start_time || null
        }));
      }

      // Transform donor data with null checks
      const donorRecipients: Recipient[] = (donors || []).map(d => ({
        id: d.id,
        name: d.name || 'Unknown Donor',
        email: d.email || '',
        type: 'donor',
        lastContacted: d.donation_date
      }));

      const allRecipients = [...donorRecipients, ...volunteerRecipients];
      
      // Update state with null checks
      setRecipients(allRecipients);
      setRecipientStats({
        totalDonors: donorRecipients.length,
        totalVolunteers: volunteerRecipients.length,
        lastEmailSent: allRecipients
          .map(r => r.lastContacted)
          .filter(Boolean)
          .sort()
          .reverse()[0] || null
      });

    } catch (err) {
      console.error('Error in fetchRecipients:', err);
      setRecipients([]);
      setRecipientStats({
        totalDonors: 0,
        totalVolunteers: 0,
        lastEmailSent: null
      });
      setError(err instanceof Error ? err.message : 'Failed to fetch recipients');
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const formData = new FormData(e.currentTarget);
      const schedule = formData.get('schedule') as string;
      
      const newTemplate = {
        user_id: user.id,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        type: formData.get('type') as 'donor' | 'volunteer' | 'both',
        subject: formData.get('subject') as string,
        content: editorContent,
        schedule: schedule,
        status: schedule === 'immediate' ? 'active' : 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: template, error } = await supabase
        .from('outreach_templates')
        .insert([newTemplate])
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [...prev, template]);
      setIsCreateOpen(false);
      setEditorContent('');

      // If schedule is immediate, activate the template right away
      if (schedule === 'immediate') {
        await activateTemplate(template);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    }
  };

  const activateTemplate = async (template: OutreachTemplate) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Filter recipients based on template type
      const targetRecipients = recipients.filter(r => 
        template.type === 'both' || r.type === template.type
      );

      if (targetRecipients.length === 0) {
        throw new Error('No recipients found for the selected type');
      }

      // Create workflow configuration
      const workflowConfig = {
        type: 'outreach',
        name: template.name,
        description: template.description,
        schedule: template.schedule,
        subject: template.subject,
        template: template.content,
        recipients: targetRecipients.map(r => ({
          id: r.id,
          email: r.email,
          name: r.name,
          type: r.type
        }))
      };

      // Insert workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('automation_workflows')
        .insert([{
          user_id: user.id,
          type: 'outreach',
          status: 'active',
          config: workflowConfig,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (workflowError) throw workflowError;

      // Start the workflow
      const response = await fetch('/api/automation/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workflowId: workflow.id,
          immediate: template.schedule === 'immediate'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start workflow');
      }

      // Update template status
      const { error: templateError } = await supabase
        .from('outreach_templates')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id);

      if (templateError) throw templateError;

      // Refresh templates
      await loadData();
      
      // Show success message
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate template');
      console.error('Error activating template:', err);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('outreach_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    return matchesSearch && matchesType;
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Outreach</h1>
          <p className="mt-2 text-gray-600">
            Create and manage communication templates for donors and volunteers
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          New Template
        </Button>
      </div>

      {/* Add recipient stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">Total Donors</p>
              <p className="text-2xl font-bold">{recipientStats.totalDonors}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Total Volunteers</p>
              <p className="text-2xl font-bold">{recipientStats.totalVolunteers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <EnvelopeIcon className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Last Email Sent</p>
              <p className="text-lg">
                {recipientStats.lastEmailSent 
                  ? new Date(recipientStats.lastEmailSent).toLocaleDateString()
                  : 'No emails sent yet'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="donor">Donor</SelectItem>
            <SelectItem value="volunteer">Volunteer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-lg">{template.name}</h3>
                <p className="text-sm text-gray-500">{template.description}</p>
              </div>
              <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                {template.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                {template.type === 'both' ? 'All Recipients' : `${template.type}s Only`}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="h-4 w-4 mr-2" />
                {template.schedule}
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTemplate(template);
                  setIsPreviewOpen(true);
                }}
              >
                Preview
              </Button>
              {template.status === 'draft' && (
                <Button
                  size="sm"
                  onClick={() => activateTemplate(template)}
                >
                  Activate
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteTemplate(template.id)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a new communication template for your donors and volunteers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTemplate} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="type">Recipient Type</Label>
                <Select name="type" defaultValue="both">
                  <SelectTrigger className="w-full bg-white border-gray-200">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="both">All Recipients</SelectItem>
                    <SelectItem value="donor">Donors Only</SelectItem>
                    <SelectItem value="volunteer">Volunteers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" required />
            </div>

            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <Input id="subject" name="subject" required />
            </div>

            <div>
              <Label>Email Content</Label>
              <Textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder="Write your email content here..."
                className="min-h-[200px]"
              />
            </div>

            <div>
              <Label htmlFor="schedule">Schedule</Label>
              <Select name="schedule" defaultValue="immediate">
                <SelectTrigger className="w-full bg-white border-gray-200">
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="immediate">Send Immediately</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Create Template
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <p className="mt-1 text-gray-700">{selectedTemplate?.subject}</p>
            </div>
            <div>
              <Label>Content</Label>
              <div
                className="mt-1 prose max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedTemplate?.content || '' }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 