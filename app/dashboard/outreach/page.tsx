'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsDisplay } from './components/StatsDisplay';
import { CampaignList } from './components/CampaignList';
import { CampaignForm } from './components/CampaignForm';
import type { CampaignFormData } from './components/CampaignForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

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

interface EmailSettings {
  id: string;
  sender_name: string;
  sender_email: string;
  reply_to_email?: string;
  organization_name?: string;
  organization_address?: string;
  organization_phone?: string;
  organization_website?: string;
  is_default: boolean;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  from_name: string;
  from_email: string;
  reply_to: string;
  status: 'pending' | 'completed' | 'failed';
  scheduled_for: string | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  completed_at: string | null;
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
  const [emailSettings, setEmailSettings] = useState<EmailSettings[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<EmailSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    sender_name: '',
    sender_email: '',
    reply_to_email: '',
    organization_name: '',
    organization_address: '',
    organization_phone: '',
    organization_website: '',
    is_default: false
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    content: '',
    fromName: '',
    fromEmail: '',
    replyTo: '',
    scheduleTime: null as Date | null,
    organizationName: '',
    organizationAddress: '',
    organizationPhone: '',
    organizationWebsite: '',
    isDefault: false
  });
  const [showCampaignForm, setShowCampaignForm] = useState(false);

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

  const loadEmailSettings = async (isMounted: boolean) => {
    try {
      const response = await fetch('/api/email-settings');
      if (!response.ok) throw new Error('Failed to fetch email settings');
      
      const data = await response.json();
      if (isMounted) {
        setEmailSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
      toast.error('Failed to load email settings');
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(data.campaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Failed to load campaigns');
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadAllData(isMounted);
    loadEmailSettings(isMounted);
    loadCampaigns();

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

  // Add new function to handle settings form submission
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!settingsForm.sender_name.trim() || !settingsForm.sender_email.trim()) {
        throw new Error('Sender name and email are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(settingsForm.sender_email)) {
        throw new Error('Invalid sender email format');
      }

      if (settingsForm.reply_to_email && !emailRegex.test(settingsForm.reply_to_email)) {
        throw new Error('Invalid reply-to email format');
      }

      const url = selectedSetting 
        ? `/api/email-settings?id=${selectedSetting.id}`
        : '/api/email-settings';
      
      const method = selectedSetting ? 'PUT' : 'POST';
      const body = selectedSetting 
        ? { ...settingsForm, id: selectedSetting.id }
        : settingsForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save email settings');
      }

      await loadEmailSettings(true);
      setIsSettingsOpen(false);
      setSelectedSetting(null);
      setSettingsForm({
        sender_name: '',
        sender_email: '',
        reply_to_email: '',
        organization_name: '',
        organization_address: '',
        organization_phone: '',
        organization_website: '',
        is_default: false
      });
      toast.success('Email settings saved successfully');
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save email settings');
    }
  };

  // Add new function to handle settings deletion
  const handleDeleteSettings = async (id: string) => {
    try {
      const response = await fetch(`/api/email-settings?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete email settings');

      await loadEmailSettings(true);
      toast.success('Email settings deleted successfully');
    } catch (error) {
      console.error('Error deleting email settings:', error);
      toast.error('Failed to delete email settings');
    }
  };

  // Add new function to handle settings edit
  const handleEditSettings = (settings: EmailSettings) => {
    setSelectedSetting(settings);
    setSettingsForm({
      sender_name: settings.sender_name,
      sender_email: settings.sender_email,
      reply_to_email: settings.reply_to_email || '',
      organization_name: settings.organization_name || '',
      organization_address: settings.organization_address || '',
      organization_phone: settings.organization_phone || '',
      organization_website: settings.organization_website || '',
      is_default: settings.is_default
    });
    setIsSettingsOpen(true);
  };

  const isFormValid = () => {
    return (
      campaignForm.name.trim() !== '' &&
      campaignForm.subject.trim() !== '' &&
      campaignForm.content.trim() !== '' &&
      campaignForm.fromName.trim() !== '' &&
      campaignForm.fromEmail.trim() !== '' &&
      selectedRecipients.length > 0 &&
      (!campaignForm.scheduleTime || campaignForm.scheduleTime > new Date())
    );
  };

  const handleCreateCampaign = async (data: CampaignFormData) => {
    // TODO: Implement campaign creation logic
    console.log('Creating campaign:', data);
    setShowCampaignForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Outreach</h1>
        <Button
          onClick={() => setShowCampaignForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Campaign
        </Button>
      </div>

      <StatsDisplay stats={recipientStats} />

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="settings">Email Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {showCampaignForm ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Create New Campaign</h2>
              <CampaignForm
                recipients={recipients}
                onSubmit={handleCreateCampaign}
                onCancel={() => setShowCampaignForm(false)}
              />
            </div>
          ) : (
            <CampaignList campaigns={campaigns} />
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Email Settings</h2>
              <Button
                onClick={() => {
                  console.log('Opening settings modal');
                  setSelectedSetting(null);
                  setSettingsForm({
                    sender_name: '',
                    sender_email: '',
                    reply_to_email: '',
                    organization_name: '',
                    organization_address: '',
                    organization_phone: '',
                    organization_website: '',
                    is_default: false
                  });
                  setIsSettingsOpen(true);
                  console.log('isSettingsOpen:', true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Setting
              </Button>
            </div>

            <div className="space-y-4">
              {emailSettings.length === 0 ? (
                <p className="text-gray-600">No email settings configured yet.</p>
              ) : (
                <div className="grid gap-4">
                  {emailSettings.map((setting) => (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <h3 className="font-medium">{setting.sender_name}</h3>
                        <p className="text-sm text-gray-600">{setting.sender_email}</p>
                        {setting.is_default && (
                          <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSettings(setting)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteSettings(setting.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>
              {selectedSetting ? 'Edit Email Setting' : 'New Email Setting'}
            </DialogTitle>
            <DialogDescription>
              Configure your email sender information and organization details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sender_name">Sender Name</Label>
              <Input
                id="sender_name"
                value={settingsForm.sender_name}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, sender_name: e.target.value }))}
                required
                placeholder="Enter sender name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sender_email">Sender Email</Label>
              <Input
                id="sender_email"
                type="email"
                value={settingsForm.sender_email}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, sender_email: e.target.value }))}
                required
                placeholder="Enter sender email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply_to_email">Reply-To Email</Label>
              <Input
                id="reply_to_email"
                type="email"
                value={settingsForm.reply_to_email}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, reply_to_email: e.target.value }))}
                placeholder="Enter reply-to email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization_name">Organization Name</Label>
              <Input
                id="organization_name"
                value={settingsForm.organization_name}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, organization_name: e.target.value }))}
                placeholder="Enter organization name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization_address">Organization Address</Label>
              <Input
                id="organization_address"
                value={settingsForm.organization_address}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, organization_address: e.target.value }))}
                placeholder="Enter organization address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization_phone">Organization Phone</Label>
              <Input
                id="organization_phone"
                value={settingsForm.organization_phone}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, organization_phone: e.target.value }))}
                placeholder="Enter organization phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization_website">Organization Website</Label>
              <Input
                id="organization_website"
                value={settingsForm.organization_website}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, organization_website: e.target.value }))}
                placeholder="Enter organization website"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={settingsForm.is_default}
                onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, is_default: checked }))}
              />
              <Label htmlFor="is_default">Set as Default</Label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSettingsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedSetting ? 'Save Changes' : 'Create Setting'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 