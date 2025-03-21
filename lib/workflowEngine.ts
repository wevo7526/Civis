import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

export interface WorkflowStep {
  id: string;
  type: 'notification' | 'email' | 'delay' | 'condition';
  config: Record<string, any>;
  next?: string;
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger: {
    type: 'event' | 'schedule' | 'manual';
    config: Record<string, any>;
  };
  steps: WorkflowStep[];
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export class WorkflowEngine {
  private supabase: SupabaseClient<Database>;
  private workflows: Map<string, Workflow> = new Map();

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  async loadWorkflows() {
    const { data, error } = await this.supabase
      .from('workflows')
      .select('*')
      .eq('isActive', true);

    if (error) {
      console.error('Error loading workflows:', error);
      return;
    }

    this.workflows.clear();
    data.forEach(workflow => {
      this.workflows.set(workflow.id, workflow as Workflow);
    });
  }

  async createWorkflow(workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('workflows')
      .insert(workflow)
      .select()
      .single();

    if (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }

    this.workflows.set(data.id, data as Workflow);
    return data;
  }

  async executeWorkflow(workflow: Database['public']['Tables']['workflows']['Row']) {
    const steps = workflow.steps as Array<{
      id: string;
      type: 'notification' | 'email' | 'delay' | 'condition';
      config: Record<string, any>;
      next?: string;
    }>;

    for (const step of steps) {
      await this.executeStep(step, workflow.user_id);
    }
  }

  private async executeStep(step: any, userId: string) {
    switch (step.type) {
      case 'notification':
        await this.createNotification(step.config, userId);
        break;
      case 'email':
        await this.sendEmail(step.config);
        break;
      case 'delay':
        await this.delay(step.config.duration);
        break;
      case 'condition':
        // Handle conditional logic
        break;
    }
  }

  private async createNotification(config: any, userId: string) {
    const { error } = await this.supabase
      .from('notifications')
      .insert([{
        title: config.title,
        message: config.message,
        type: 'info',
        user_id: userId,
        read: false
      }]);

    if (error) throw error;
  }

  private async sendEmail(config: any) {
    // Get the email template
    const { data: template, error: templateError } = await this.supabase
      .from('email_templates')
      .select('*')
      .eq('id', config.template)
      .single();

    if (templateError) throw templateError;

    // TODO: Implement email sending logic
    // This would typically use a service like SendGrid, AWS SES, etc.
    console.log('Sending email:', {
      to: config.to,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  private async delay(duration: number) {
    return new Promise(resolve => setTimeout(resolve, duration));
  }
} 