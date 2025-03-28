'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  Cog6ToothIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PaperAirplaneIcon,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  organization_name?: string;
  organization_address?: string;
  organization_phone?: string;
  organization_website?: string;
  is_default?: boolean;
  recipient_ids?: string[];
  user_id: string;
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
  const [typeFilter, setTypeFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
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
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

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
      const { data: campaigns, error } = await createClientComponentClient()
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(campaigns || []);
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

  // Enhanced AI content generation
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    try {
      setIsGenerating(true);
      const toastId = toast.loading('Generating content...');
      
      // Get recipient context
      const recipientContext = selectedRecipients.length > 0 
        ? `Target audience: ${selectedRecipients.length} recipients (${selectedRecipients.map(r => r.type).join(', ')})`
        : '';

      const response = await fetch('/api/ai/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate an engaging email campaign for ${formData.type} recipients. 
                  ${recipientContext}
                  Subject: ${formData.subject}
                  Additional context: ${aiPrompt}
                  
                  Please provide:
                  1. A compelling subject line
                  2. An engaging opening paragraph
                  3. Main content with clear call-to-action
                  4. Closing paragraph
                  5. Suggested follow-up timing`,
          context: {
            currentPage: 'outreach',
            templateType: formData.type,
            subject: formData.subject,
            recipientCount: selectedRecipients.length,
            recipientTypes: [...new Set(selectedRecipients.map(r => r.type))]
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI assistance');
      }

      const data = await response.json();
      if (data.success && data.content?.[0]?.text) {
        const generatedContent = data.content[0].text;
        
        // Parse the AI response into sections
        const sections = generatedContent.split('\n\n');
        const subjectLine = sections[0].replace('Subject:', '').trim();
        const opening = sections[1];
        const mainContent = sections[2];
        const closing = sections[3];
        const followUp = sections[4];

        // Update form data with generated content
        setFormData(prev => ({
          ...prev,
          subject: subjectLine
        }));
        
        setEditorContent(prev => {
          const newContent = [
            opening,
            mainContent,
            closing,
            '\n---\n',
            'Suggested follow-up:',
            followUp
          ].join('\n\n');
          return prev ? `${prev}\n\n${newContent}` : newContent;
        });

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
  const handleCreateTemplate = async (data: CampaignFormData) => {
    setError(null);

    try {
      const { data: { user } } = await createClientComponentClient().auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate required fields
      if (!data.name || !data.subject || !data.content) {
        throw new Error('Please fill in all required fields');
      }

      // Create the template
      const newTemplate = {
        user_id: user.id,
        name: data.name,
        type: data.type as 'donor' | 'volunteer' | 'both',
        subject: data.subject,
        content: data.content,
        schedule: 'immediate',
        status: 'draft'
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

  // Update handleEditTemplate
  const handleEditTemplate = async (data: CampaignFormData) => {
    setError(null);

    try {
      const { data: { user } } = await createClientComponentClient().auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!editingTemplate) throw new Error('No template selected for editing');

      // Validate required fields
      if (!data.name || !data.subject || !data.content) {
        throw new Error('Please fill in all required fields');
      }

      // Update the template
      const updatedTemplate = {
        name: data.name,
        type: data.type as 'donor' | 'volunteer' | 'both',
        subject: data.subject,
        content: data.content,
        status: editingTemplate.status
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

  // Update the form submission handler
  const handleFormSubmit = async (data: CampaignFormData) => {
    if (isEditMode) {
      await handleEditTemplate(data);
    } else {
      await handleCreateTemplate(data);
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

  // Add edit template function
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
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await createClientComponentClient().auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const campaignData = {
        name: data.name,
        subject: data.subject,
        content: data.content,
        from_name: data.fromName,
        from_email: data.fromEmail,
        reply_to: data.replyTo,
        scheduled_for: data.scheduleTime?.toISOString() || null,
        total_recipients: data.recipients.length,
        status: data.scheduleTime ? 'pending' : 'completed',
        organization_name: data.organizationName,
        organization_address: data.organizationAddress,
        organization_phone: data.organizationPhone,
        organization_website: data.organizationWebsite
      };

      if (editingCampaign) {
        const { error: updateError } = await createClientComponentClient()
          .from('email_campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id);

        if (updateError) {
          console.error('Campaign update error:', updateError);
          throw new Error(updateError.message || 'Failed to update campaign');
        }
        toast.success('Campaign updated successfully');
      } else {
        const { error: insertError } = await createClientComponentClient()
          .from('email_campaigns')
          .insert({
            ...campaignData,
            user_id: user.id,
          });

        if (insertError) {
          console.error('Campaign creation error:', insertError);
          throw new Error(insertError.message || 'Failed to create campaign');
        }
        toast.success('Campaign created successfully');
      }

      await loadCampaigns();
      setIsCampaignOpen(false);
      setEditingCampaign(null);
    } catch (error) {
      console.error('Error saving campaign:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save campaign';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Add function to handle campaign editing
  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsCampaignOpen(true);
  };

  // Add handleDeleteCampaign function
  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await createClientComponentClient()
        .from('email_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
      toast.success('Campaign deleted successfully');
      await loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete campaign');
    } finally {
      setLoading(false);
    }
  };

  // Add A/B testing functionality
  const createABTest = async (campaign: Campaign) => {
    try {
      const { data: { user } } = await createClientComponentClient().auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create A/B test variants
      const variants = [
        {
          name: `${campaign.name} - Variant A`,
          subject: campaign.subject,
          content: campaign.content,
          from_name: campaign.from_name,
          from_email: campaign.from_email,
          reply_to: campaign.reply_to,
          status: 'pending',
          parent_campaign_id: campaign.id,
          variant: 'A',
          user_id: user.id
        },
        {
          name: `${campaign.name} - Variant B`,
          subject: campaign.subject,
          content: campaign.content,
          from_name: campaign.from_name,
          from_email: campaign.from_email,
          reply_to: campaign.reply_to,
          status: 'pending',
          parent_campaign_id: campaign.id,
          variant: 'B',
          user_id: user.id
        }
      ];

      const { error } = await createClientComponentClient()
        .from('email_campaigns')
        .insert(variants);

      if (error) throw error;

      toast.success('A/B test created successfully');
      await loadCampaigns();
    } catch (error) {
      console.error('Error creating A/B test:', error);
      toast.error('Failed to create A/B test');
    }
  };

  // Add automated follow-up sequence
  const createFollowUpSequence = async (campaign: Campaign) => {
    try {
      const { data: { user } } = await createClientComponentClient().auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create follow-up sequence
      const followUps = [
        {
          name: `${campaign.name} - Follow-up 1`,
          subject: `Re: ${campaign.subject}`,
          content: `Hi there,\n\nI wanted to follow up on my previous email...`,
          from_name: campaign.from_name,
          from_email: campaign.from_email,
          reply_to: campaign.reply_to,
          status: 'pending',
          parent_campaign_id: campaign.id,
          sequence_number: 1,
          delay_days: 3,
          user_id: user.id
        },
        {
          name: `${campaign.name} - Follow-up 2`,
          subject: `Re: ${campaign.subject}`,
          content: `Hi there,\n\nI hope this email finds you well...`,
          from_name: campaign.from_name,
          from_email: campaign.from_email,
          reply_to: campaign.reply_to,
          status: 'pending',
          parent_campaign_id: campaign.id,
          sequence_number: 2,
          delay_days: 7,
          user_id: user.id
        }
      ];

      const { error } = await createClientComponentClient()
        .from('email_campaigns')
        .insert(followUps);

      if (error) throw error;

      toast.success('Follow-up sequence created successfully');
      await loadCampaigns();
    } catch (error) {
      console.error('Error creating follow-up sequence:', error);
      toast.error('Failed to create follow-up sequence');
    }
  };

  // Add campaign analytics
  const getCampaignAnalytics = async (campaignId: string) => {
    try {
      const { data, error } = await createClientComponentClient()
        .from('campaign_analytics')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      return null;
    }
  };

  // Add recipient segmentation
  const segmentRecipients = (recipients: Recipient[]) => {
    const segments = {
      highValue: recipients.filter(r => r.type === 'donor' && (r.totalDonations || 0) > 1000),
      activeVolunteers: recipients.filter(r => r.type === 'volunteer' && (r.hours || 0) > 20),
      recentDonors: recipients.filter(r => {
        if (r.type !== 'donor' || !r.lastDonation) return false;
        const lastDonationDate = new Date(r.lastDonation);
        return lastDonationDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }),
      inactiveRecipients: recipients.filter(r => {
        if (!r.lastContact) return true;
        const lastContactDate = new Date(r.lastContact);
        return lastContactDate < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      })
    };

    return segments;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Outreach</h1>
          <p className="text-gray-500 mt-1">Manage your email campaigns and track performance</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setIsSettingsOpen(true)}
            variant="outline"
            className="text-purple-600 border-purple-600 hover:bg-purple-50"
          >
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            Settings
          </Button>
          <Button
            onClick={() => setIsCampaignOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Recipients</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {recipientStats.totalDonors + recipientStats.totalVolunteers}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {campaigns.filter(c => c.status === 'pending').length}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <EnvelopeIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {campaigns.length > 0 
                  ? `${((campaigns.filter(c => c.status === 'completed').length / campaigns.length) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sent</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {campaigns.reduce((acc, campaign) => acc + campaign.sent_count, 0)}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <PaperAirplaneIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="bg-white p-1 rounded-lg shadow-sm">
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-600">
            <EnvelopeIcon className="h-5 w-5 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-600">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-4">
                <Input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Select
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as 'all' | 'pending' | 'completed' | 'failed')}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CampaignList 
              campaigns={campaigns.filter(campaign => {
                const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    campaign.subject.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesStatus = typeFilter === 'all' || campaign.status === typeFilter;
                return matchesSearch && matchesStatus;
              })}
              onEdit={handleEditCampaign}
              onDelete={handleDeleteCampaign}
              onCreateABTest={createABTest}
              onCreateFollowUp={createFollowUpSequence}
            />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Performance</h3>
              <div className="space-y-4">
                {campaigns.map(async (campaign) => {
                  const analytics = await getCampaignAnalytics(campaign.id);
                  return (
                    <div key={campaign.id} className="border-b pb-4 last:border-0">
                      <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <p className="text-sm text-gray-500">Open Rate</p>
                          <p className="text-lg font-semibold">
                            {analytics?.open_rate ? `${(analytics.open_rate * 100).toFixed(1)}%` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Click Rate</p>
                          <p className="text-lg font-semibold">
                            {analytics?.click_rate ? `${(analytics.click_rate * 100).toFixed(1)}%` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Conversion Rate</p>
                          <p className="text-lg font-semibold">
                            {analytics?.conversion_rate ? `${(analytics.conversion_rate * 100).toFixed(1)}%` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Unsubscribe Rate</p>
                          <p className="text-lg font-semibold">
                            {analytics?.unsubscribe_rate ? `${(analytics.unsubscribe_rate * 100).toFixed(1)}%` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recipient Segments</h3>
              <div className="space-y-4">
                {Object.entries(segmentRecipients(recipients)).map(([segment, recipients]) => (
                  <div key={segment} className="border-b pb-4 last:border-0">
                    <h4 className="font-medium text-gray-900 capitalize">
                      {segment.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <p className="text-2xl font-semibold mt-2">{recipients.length}</p>
                    <p className="text-sm text-gray-500">
                      {((recipients.length / recipients.length) * 100).toFixed(1)}% of total recipients
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Engagement Trends</h3>
              <div className="h-64">
                {/* Add engagement chart component here */}
                <p className="text-gray-500 text-center">Engagement trends visualization coming soon</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingTemplate 
                ? 'Update your template details.'
                : 'Create a new email template and fill in the required fields.'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <CampaignForm
              recipients={recipients}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsCreateOpen(false);
                setEditingTemplate(null);
              }}
              template={editingTemplate ? {
                id: editingTemplate.id,
                name: editingTemplate.name,
                description: editingTemplate.description,
                type: editingTemplate.type,
                subject: editingTemplate.subject,
                content: editingTemplate.content,
                status: editingTemplate.status
              } : undefined}
            />
          </div>
        </DialogContent>
      </Dialog>

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

      <Dialog open={isCampaignOpen} onOpenChange={setIsCampaignOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingCampaign 
                ? 'Update your campaign details and recipients.'
                : 'Create a new email campaign and select recipients.'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <CampaignForm
              recipients={recipients}
              onSubmit={handleCreateCampaign}
              onCancel={() => {
                setIsCampaignOpen(false);
                setEditingCampaign(null);
              }}
              campaign={editingCampaign ? {
                id: editingCampaign.id,
                name: editingCampaign.name,
                subject: editingCampaign.subject,
                content: editingCampaign.content,
                fromName: editingCampaign.from_name,
                fromEmail: editingCampaign.from_email,
                replyTo: editingCampaign.reply_to,
                scheduleTime: editingCampaign.scheduled_for ? new Date(editingCampaign.scheduled_for) : null,
                organizationName: editingCampaign.organization_name || '',
                organizationAddress: editingCampaign.organization_address || '',
                organizationPhone: editingCampaign.organization_phone || '',
                organizationWebsite: editingCampaign.organization_website || '',
                isDefault: editingCampaign.is_default || false,
                recipients: recipients.filter(r => editingCampaign.recipient_ids?.includes(r.id)),
                type: 'both'
              } : undefined}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 