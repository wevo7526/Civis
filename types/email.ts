import { MailDataRequired } from '@sendgrid/mail';

export interface EmailSettings {
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

export interface EmailLog {
  id: string;
  user_id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  content: string;
  status: 'sent' | 'failed';
  sent_at: string;
  sendgrid_message_id?: string;
  sender_email: string;
  sender_name: string;
  organization_name?: string;
  error_message?: string;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  content: string;
  recipientName: string;
  templateId?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailTemplate {
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

export interface Campaign {
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

export type SendGridMessage = MailDataRequired & {
  customArgs: {
    user_id: string;
    template_id?: string;
  };
}; 