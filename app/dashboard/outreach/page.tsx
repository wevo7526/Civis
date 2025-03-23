'use client';

import { useState, useEffect, useRef } from 'react';
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
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
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
import { toast } from 'sonner';
import { Loading } from '@/components/ui/loading';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface OutreachTemplate {
  id: string;
  name: string;
  description: string;
  type: 'donor' | 'volunteer' | 'both';
  subject: string;
  content: string;
  status: 'draft' | 'active' | 'paused';
  created_at: string;
  updated_at: string;
  scheduledDate?: string;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  type: 'donor' | 'volunteer' | 'participant';
  status?: string;
  lastContact?: string;
  totalDonations?: number;
  lastDonation?: string;
  hours?: number;
  skills?: string[];
  tags?: string[];
  notes?: string;
  donor?: any;
  volunteer?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface EmailTemplate {
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
  const [recipientStats, setRecipientStats] = useState({
    totalDonors: 0,
    totalVolunteers: 0,
    totalParticipants: 0,
    activeDonors: 0,
    activeVolunteers: 0,
    activeParticipants: 0,
    recentDonors: 0,
    recentVolunteers: 0,
    recentParticipants: 0
  });
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());
  const [isRichText, setIsRichText] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'both',
    subject: '',
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OutreachTemplate | null>(null);

  const loadAllData = async (isMounted: boolean) => {
    if (!isMounted) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClientComponentClient();
      
      // First check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Not authenticated');
      }

      // Fetch data in parallel with proper error handling
      const [templatesResult, donorsResult, volunteersResult] = await Promise.allSettled([
        supabase.from('outreach_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('donors').select('*').order('created_at', { ascending: false }),
        supabase.from('volunteers').select('*').order('created_at', { ascending: false })
      ]);

      if (!isMounted) return;

      // Handle templates
      if (templatesResult.status === 'fulfilled') {
        const { data: templateData, error: templateError } = templatesResult.value;
        if (templateError) {
          console.error('Error fetching templates:', {
            message: templateError.message,
            details: templateError.details,
            hint: templateError.hint
          });
          throw new Error(`Failed to fetch templates: ${templateError.message}`);
        }
        setTemplates(templateData || []);
      } else {
        console.error('Templates fetch failed:', {
          reason: templatesResult.reason,
          stack: templatesResult.reason instanceof Error ? templatesResult.reason.stack : undefined
        });
        throw new Error('Failed to fetch templates');
      }

      // Handle donors and volunteers
      if (donorsResult.status === 'fulfilled' && volunteersResult.status === 'fulfilled') {
        const { data: donors, error: donorError } = donorsResult.value;
        const { data: volunteers, error: volunteerError } = volunteersResult.value;

        if (donorError) {
          console.error('Error fetching donors:', {
            message: donorError.message,
            details: donorError.details,
            hint: donorError.hint
          });
          throw new Error(`Failed to fetch donors: ${donorError.message}`);
        }
        if (volunteerError) {
          console.error('Error fetching volunteers:', {
            message: volunteerError.message,
            details: volunteerError.details,
            hint: volunteerError.hint
          });
          throw new Error(`Failed to fetch volunteers: ${volunteerError.message}`);
        }

        // Process recipients
        const processedRecipients = [
          ...(donors || []).map(donor => ({
            id: donor.id,
            name: donor.name,
            email: donor.email,
            type: 'donor' as const,
            status: donor.status,
            donationDate: donor.donation_date,
            phone: donor.phone,
            notes: donor.notes || '',
            createdAt: donor.created_at,
            updatedAt: donor.updated_at
          })),
          ...(volunteers || []).map(volunteer => ({
            id: volunteer.id,
            name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email,
            type: 'volunteer' as const,
            status: volunteer.status,
            phone: volunteer.phone,
            skills: volunteer.skills || [],
            interests: volunteer.interests || [],
            availability: volunteer.availability || {},
            totalHours: volunteer.total_hours || 0,
            createdAt: volunteer.created_at,
            updatedAt: volunteer.updated_at
          }))
        ];

        setRecipients(processedRecipients);

        // Calculate stats
        const stats = {
          totalDonors: donors?.length || 0,
          totalVolunteers: volunteers?.length || 0,
          totalParticipants: 0,
          activeDonors: donors?.filter(d => d.status === 'active').length || 0,
          activeVolunteers: volunteers?.filter(v => v.status === 'active').length || 0,
          activeParticipants: 0,
          recentDonors: donors?.filter(d => {
            const donationDate = new Date(d.donation_date);
            return donationDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          }).length || 0,
          recentVolunteers: volunteers?.filter(v => {
            const createdAt = new Date(v.created_at);
            return createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          }).length || 0,
          recentParticipants: 0
        };

        setRecipientStats(stats);
      } else {
        console.error('Donors or volunteers fetch failed:', {
          donors: donorsResult.status === 'rejected' ? {
            reason: donorsResult.reason,
            stack: donorsResult.reason instanceof Error ? donorsResult.reason.stack : undefined
          } : null,
          volunteers: volunteersResult.status === 'rejected' ? {
            reason: volunteersResult.reason,
            stack: volunteersResult.reason instanceof Error ? volunteersResult.reason.stack : undefined
          } : null
        });
        throw new Error('Failed to fetch donors or volunteers');
      }
    } catch (err) {
      if (!isMounted) return;
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      console.error('Error loading data:', {
        message: errorMessage,
        error: err,
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadAllData(isMounted);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      setEditorContent(selectedTemplate.content);
    } else {
      setEditorContent('');
    }
  }, [selectedTemplate]);

  // Update form data handler
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update select handler
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      type: value
    }));
  };

  // Update rich text formatting functions
  const formatText = (command: string) => {
    if (!editorRef.current) return;
    
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editorContent.substring(start, end);
    
    let newText = editorContent;
    let newCursorPos = start;
    
    switch (command) {
      case 'bold':
        newText = editorContent.substring(0, start) + 
                 `**${selectedText}**` + 
                 editorContent.substring(end);
        newCursorPos = start + 2;
        break;
      case 'italic':
        newText = editorContent.substring(0, start) + 
                 `*${selectedText}*` + 
                 editorContent.substring(end);
        newCursorPos = start + 1;
        break;
      case 'list':
        const lines = selectedText.split('\n');
        newText = editorContent.substring(0, start) + 
                 lines.map(line => `- ${line}`).join('\n') + 
                 editorContent.substring(end);
        newCursorPos = start + 2;
        break;
    }
    
    setEditorContent(newText);
    
    // Restore cursor position after state update
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos + selectedText.length);
      }
    }, 0);
  };

  // Update AI assistant function
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    try {
      setIsGenerating(true);
      const toastId = toast.loading('Generating content...');
      
      const response = await fetch('/api/ai/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Help me write an email for ${formData.type} recipients. The subject is: ${formData.subject}. ${aiPrompt}`,
          context: {
            currentPage: 'outreach',
            templateType: formData.type,
            subject: formData.subject
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI assistance');
      }

      const data = await response.json();
      if (data.success && data.content?.[0]?.text) {
        setEditorContent(prev => prev + '\n\n' + data.content[0].text);
        toast.success('Content generated successfully', { id: toastId });
        setAiPrompt('');
      } else {
        throw new Error('Invalid AI response');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  // Update handleCreateTemplate
  const handleCreateTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const { data: { user } } = await createClientComponentClient().auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate required fields
      if (!formData.name || !formData.subject || !editorContent) {
        throw new Error('Please fill in all required fields');
      }

      // Create the template
      const newTemplate = {
        user_id: user.id,
        name: formData.name,
        type: formData.type as 'donor' | 'volunteer' | 'both',
        subject: formData.subject,
        content: editorContent,
        schedule: 'immediate', // Add default schedule value
        status: 'draft' // Start as draft
      };

      // Create the template in the database
      const { data: template, error: templateError } = await createClientComponentClient()
        .from('outreach_templates')
        .insert([newTemplate])
        .select()
        .single();

      if (templateError) {
        console.error('Template creation error:', templateError);
        throw new Error(templateError.message);
      }

      if (!template) {
        throw new Error('Failed to create template - no data returned');
      }

      // Update the templates list
      setTemplates(prev => [template, ...prev]);
      
      // Reset form
      setIsCreateOpen(false);
      setEditorContent('');
      setFormData({
        name: '',
        description: '',
        type: 'both',
        subject: '',
      });

      // Show success message
      toast.success('Template created successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error creating template:', err);
    }
  };

  const activateTemplate = async (template: OutreachTemplate) => {
    try {
      const { data: { user } } = await createClientComponentClient().auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Filter recipients based on template type
      const targetRecipients = recipients.filter(r => 
        template.type === 'both' || r.type === template.type
      );

      if (targetRecipients.length === 0) {
        throw new Error('No recipients found for the selected type');
      }

      // Get auth token for edge function
      const { data: { session }, error: sessionError } = await createClientComponentClient().auth.getSession();
      if (sessionError || !session) throw new Error('Failed to get session');

      // Send emails to all recipients with rate limiting
      const batchSize = 5; // Send 5 emails at a time
      const batches = [];
      
      for (let i = 0; i < targetRecipients.length; i += batchSize) {
        batches.push(targetRecipients.slice(i, i + batchSize));
      }

      let successCount = 0;
      let failureCount = 0;

      for (const batch of batches) {
        const batchPromises = batch.map(async (recipient) => {
          try {
            const response = await fetch('/api/send-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                to: recipient.email,
                subject: template.subject,
                content: template.content,
                recipientName: recipient.name,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error(`Failed to send email to ${recipient.email}:`, errorData);
              failureCount++;
              return null;
            }

            successCount++;
            return response.json();
          } catch (err) {
            console.error(`Error sending email to ${recipient.email}:`, err);
            failureCount++;
            return null;
          }
        });

        // Wait for the current batch to complete before sending the next batch
        await Promise.all(batchPromises);
        // Add a small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Update template status
      const { error: templateError } = await createClientComponentClient()
        .from('outreach_templates')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id);

      if (templateError) throw templateError;

      // Refresh templates
      await loadAllData(true);
      
      // Show success message with stats
      toast.success(`Template activated. ${successCount} emails sent successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate template';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error activating template:', err);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await createClientComponentClient()
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

  // Add edit template function
  const handleEditTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const { data: { user } } = await createClientComponentClient().auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!editingTemplate) throw new Error('No template selected for editing');

      // Validate required fields
      if (!formData.name || !formData.subject || !editorContent) {
        throw new Error('Please fill in all required fields');
      }

      // Update the template
      const updatedTemplate = {
        name: formData.name,
        type: formData.type as 'donor' | 'volunteer' | 'both',
        subject: formData.subject,
        content: editorContent,
        status: editingTemplate.status // Keep the current status
      };

      // First, check if the template exists and user has access
      const { data: existingTemplate, error: checkError } = await createClientComponentClient()
        .from('outreach_templates')
        .select('*')
        .eq('id', editingTemplate.id)
        .eq('user_id', user.id)
        .single();

      if (checkError || !existingTemplate) {
        throw new Error('Template not found or access denied');
      }

      // Update the template in the database
      const { data: template, error: templateError } = await createClientComponentClient()
        .from('outreach_templates')
        .update(updatedTemplate)
        .eq('id', editingTemplate.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (templateError) {
        console.error('Template update error:', templateError);
        throw new Error(templateError.message);
      }

      if (!template) {
        throw new Error('Failed to update template - no data returned');
      }

      // Update the templates list
      setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
      
      // Reset form and close dialog
      setIsCreateOpen(false);
      setIsEditMode(false);
      setEditingTemplate(null);
      setEditorContent('');
      setFormData({
        name: '',
        description: '',
        type: 'both',
        subject: '',
      });

      // Show success message
      toast.success('Template updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error updating template:', err);
    }
  };

  // Add function to open edit mode
  const openEditMode = (template: OutreachTemplate) => {
    setEditingTemplate(template);
    setIsEditMode(true);
    setIsCreateOpen(true);
    setFormData({
      name: template.name,
      description: template.description,
      type: template.type,
      subject: template.subject,
    });
    setEditorContent(template.content);
  };

  // Update the form submission handler
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (isEditMode) {
      await handleEditTemplate(e);
    } else {
      await handleCreateTemplate(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Outreach</h1>
          <p className="mt-2 text-gray-600">
            Create and manage communication templates for donors and volunteers
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Template
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-50 rounded-full">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Donors</p>
              <p className="text-2xl font-bold text-gray-900">{recipientStats.totalDonors}</p>
              <p className="text-sm text-gray-500 mt-1">
                {recipientStats.activeDonors} active
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Volunteers</p>
              <p className="text-2xl font-bold text-gray-900">{recipientStats.totalVolunteers}</p>
              <p className="text-sm text-gray-500 mt-1">
                {recipientStats.activeVolunteers} active
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-50 rounded-full">
              <EnvelopeIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Recent Activity</p>
              <p className="text-2xl font-bold text-gray-900">
                {recipientStats.recentDonors + recipientStats.recentVolunteers}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Last 30 days
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters Section */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-gray-200 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>
        <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
          <SelectTrigger className="w-[200px] border-gray-200 focus:border-purple-500 focus:ring-purple-500">
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
          <Card key={template.id} className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-lg text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
              </div>
              <Badge 
                variant={template.status === 'active' ? 'default' : 'secondary'}
                className={`${
                  template.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : template.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                } border-0`}
              >
                {template.status}
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                {template.type === 'both' ? 'All Recipients' : `${template.type}s Only`}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-400" />
                {template.content.length > 100 
                  ? `${template.content.substring(0, 100)}...` 
                  : template.content}
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTemplate(template);
                  setIsPreviewOpen(true);
                }}
                className="border-gray-200 hover:bg-gray-50"
              >
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditMode(template)}
                className="border-gray-200 hover:bg-gray-50"
              >
                Edit
              </Button>
              {template.status === 'draft' && (
                <Button
                  size="sm"
                  onClick={() => activateTemplate(template)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Activate
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteTemplate(template.id)}
                className="bg-red-50 text-red-600 hover:bg-red-100 border-0"
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-lg rounded-lg">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b border-gray-100">
            <DialogTitle className="text-2xl font-semibold text-gray-900">
              {isEditMode ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {isEditMode ? 'Update your communication template.' : 'Create a new communication template for your donors and volunteers.'}
            </DialogDescription>
          </DialogHeader>

          <form id="create-template-form" onSubmit={handleFormSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Template Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name}
                  onChange={handleFormChange}
                  required 
                  placeholder="Enter template name"
                  className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium text-gray-700">Recipient Type</Label>
                <Select value={formData.type} onValueChange={handleSelectChange}>
                  <SelectTrigger className="w-full border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">All Recipients</SelectItem>
                    <SelectItem value="donor">Donors Only</SelectItem>
                    <SelectItem value="volunteer">Volunteers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium text-gray-700">Email Subject</Label>
              <Input 
                id="subject" 
                name="subject" 
                value={formData.subject}
                onChange={handleFormChange}
                required 
                placeholder="Enter email subject"
                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Email Content</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="rich-text"
                      checked={isRichText}
                      onCheckedChange={setIsRichText}
                      className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-200 relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 [&>span]:bg-white [&>span]:translate-x-0 data-[state=checked]:[&>span]:translate-x-4"
                    />
                    <Label htmlFor="rich-text" className="text-sm text-gray-600">Rich Text Editor</Label>
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {isRichText && (
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => formatText('bold')}
                              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            >
                              <BoldIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Bold</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => formatText('italic')}
                              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            >
                              <ItalicIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Italic</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => formatText('list')}
                              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            >
                              <ListBulletIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Bullet List</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                )}
                <Textarea
                  ref={editorRef}
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  placeholder="Write your email content here..."
                  className="min-h-[200px] border-0 focus:ring-0"
                />
              </div>

              {/* AI Assistant Section */}
              <div className="mt-2 space-y-2">
                <Label className="text-sm font-medium text-gray-700">AI Assistant</Label>
                <div className="flex gap-2">
                  <Input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Enter your prompt for AI assistance..."
                    className="flex-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                  <Button
                    type="button"
                    onClick={handleAIGenerate}
                    disabled={isGenerating}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsEditMode(false);
                  setEditingTemplate(null);
                  setEditorContent('');
                  setFormData({
                    name: '',
                    description: '',
                    type: 'both',
                    subject: '',
                  });
                }}
                className="border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                form="create-template-form"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!formData.name || !formData.subject || !editorContent}
              >
                {isEditMode ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl bg-white shadow-lg rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-900">{selectedTemplate?.name}</DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Type</Label>
                <p className="text-gray-900">{selectedTemplate?.type === 'both' ? 'All Recipients' : `${selectedTemplate?.type}s Only`}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Subject</Label>
              <p className="text-gray-900">{selectedTemplate?.subject}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Content</Label>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedTemplate?.content || '' }}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(false)}
                className="border-gray-200 hover:bg-gray-50"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  if (selectedTemplate) {
                    activateTemplate(selectedTemplate);
                    setIsPreviewOpen(false);
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Send Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 