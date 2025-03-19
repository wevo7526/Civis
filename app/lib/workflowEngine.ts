import { createClient } from '@supabase/supabase-js';
import { Anthropic } from '@anthropic-ai/sdk';

interface WorkflowConfig {
  type: string;
  schedule: string;
  template: string;
  metrics?: string[];
  recipients?: string[];
  variables?: string[];
}

interface Workflow {
  id: string;
  user_id: string;
  type: string;
  status: 'active' | 'inactive';
  config: WorkflowConfig;
  last_run?: string;
  next_run?: string;
  stats?: {
    totalRuns: number;
    successRate: number;
    lastError?: string;
  };
}

export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private supabase;
  private anthropic;
  private runningWorkflows: Map<string, NodeJS.Timeout>;
  private maxRetries: number = 3;
  private retryDelay: number = 5000; // 5 seconds

  private constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
    this.runningWorkflows = new Map();
  }

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  public async startWorkflow(workflow: Workflow): Promise<void> {
    if (workflow.status !== 'active') return;

    const schedule = this.parseSchedule(workflow.config.schedule);
    if (!schedule) return;

    // Clear any existing interval
    this.stopWorkflow(workflow.id);

    // Set up new interval
    const interval = setInterval(async () => {
      try {
        await this.executeWorkflow(workflow);
      } catch (error) {
        console.error(`Error executing workflow ${workflow.id}:`, error);
        await this.handleWorkflowError(workflow, error);
      }
    }, schedule);

    this.runningWorkflows.set(workflow.id, interval);
  }

  public stopWorkflow(workflowId: string): void {
    const interval = this.runningWorkflows.get(workflowId);
    if (interval) {
      clearInterval(interval);
      this.runningWorkflows.delete(workflowId);
    }
  }

  public async getWorkflowData(workflow: Workflow): Promise<any> {
    switch (workflow.type) {
      case 'donor-communications':
        return this.getDonorData();
      case 'grant-reminders':
        return this.getGrantData();
      case 'impact-reports':
        return this.getImpactData();
      case 'campaign-performance':
        return this.getCampaignData();
      default:
        return {};
    }
  }

  public async generateContent(workflow: Workflow, data: any): Promise<string> {
    const prompt = this.buildPrompt(workflow, data);
    
    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: 'You are an expert nonprofit communications assistant. Generate clear, professional content based on the provided data and template.',
    });

    if (!response.content[0] || response.content[0].type !== 'text') {
      throw new Error('Invalid response from AI service');
    }

    return response.content[0].text;
  }

  private parseSchedule(schedule: string): number | null {
    switch (schedule) {
      case 'immediate':
        return 0;
      case 'daily':
        return 24 * 60 * 60 * 1000;
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000;
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000;
      case 'quarterly':
        return 90 * 24 * 60 * 60 * 1000;
      default:
        return null;
    }
  }

  private async executeWorkflow(workflow: Workflow): Promise<void> {
    let retries = 0;
    while (retries < this.maxRetries) {
      try {
        // Get relevant data based on workflow type
        const data = await this.getWorkflowData(workflow);
        
        // Generate content using AI
        const content = await this.generateContent(workflow, data);
        
        // Send notifications/updates
        await this.sendUpdates(workflow, content);
        
        // Update workflow status
        await this.updateWorkflowStatus(workflow, true);
        
        // Update stats
        await this.updateWorkflowStats(workflow, true);
        
        return;
      } catch (error) {
        retries++;
        if (retries === this.maxRetries) {
          await this.handleWorkflowError(workflow, error);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  private async handleWorkflowError(workflow: Workflow, error: any): Promise<void> {
    console.error(`Workflow ${workflow.id} failed:`, error);
    
    // Update workflow status
    await this.updateWorkflowStatus(workflow, false);
    
    // Update stats with error
    await this.updateWorkflowStats(workflow, false, error.message);
    
    // Notify admin
    await this.notifyAdmin(workflow, error);
  }

  private async notifyAdmin(workflow: Workflow, error: any): Promise<void> {
    try {
      const { data: user } = await this.supabase
        .from('users')
        .select('email')
        .eq('id', workflow.user_id)
        .single();

      if (user?.email) {
        // Store the notification in the database
        await this.supabase
          .from('notifications')
          .insert({
            user_id: workflow.user_id,
            type: 'workflow_error',
            title: `Workflow Error: ${workflow.type}`,
            content: `
              <h2>Workflow Error</h2>
              <p>The workflow "${workflow.type}" has encountered an error:</p>
              <pre>${error.message}</pre>
              <p>Please check the workflow configuration and try again.</p>
            `,
            read: false,
          });

        // Update user's email preferences to receive notifications
        await this.supabase
          .from('user_preferences')
          .upsert({
            user_id: workflow.user_id,
            email_notifications: true,
          });
      }
    } catch (notifyError) {
      console.error('Error notifying admin:', notifyError);
    }
  }

  private async sendUpdates(workflow: Workflow, content: string): Promise<void> {
    if (!workflow.config.recipients?.length) {
      console.warn(`No recipients configured for workflow ${workflow.id}`);
      return;
    }

    try {
      // Store notifications for each recipient
      const notifications = workflow.config.recipients.map(recipient => ({
        user_id: recipient,
        type: workflow.type,
        title: `Automated Update: ${workflow.type}`,
        content: content,
        read: false,
      }));

      await this.supabase
        .from('notifications')
        .insert(notifications);

      // Update email preferences for recipients
      const preferences = workflow.config.recipients.map(recipient => ({
        user_id: recipient,
        email_notifications: true,
      }));

      await this.supabase
        .from('user_preferences')
        .upsert(preferences);

      // Log the notification
      await this.supabase
        .from('notification_logs')
        .insert({
          workflow_id: workflow.id,
          type: workflow.type,
          recipients: workflow.config.recipients,
          content: content,
          status: 'sent',
        });
    } catch (error) {
      console.error(`Error sending updates for workflow ${workflow.id}:`, error);
      throw error;
    }
  }

  private async updateWorkflowStatus(workflow: Workflow, success: boolean): Promise<void> {
    const now = new Date();
    const nextRun = this.calculateNextRun(workflow.config.schedule, now);

    await this.supabase
      .from('automation_workflows')
      .update({
        last_run: now.toISOString(),
        next_run: nextRun.toISOString(),
        status: success ? 'active' : 'error',
      })
      .eq('id', workflow.id);
  }

  private async updateWorkflowStats(workflow: Workflow, success: boolean, error?: string): Promise<void> {
    const stats = workflow.stats || {
      totalRuns: 0,
      successRate: 0,
    };

    const newStats = {
      totalRuns: stats.totalRuns + 1,
      successRate: ((stats.successRate * stats.totalRuns + (success ? 1 : 0)) / (stats.totalRuns + 1)) * 100,
      lastError: error || stats.lastError,
    };

    await this.supabase
      .from('automation_workflows')
      .update({ stats: newStats })
      .eq('id', workflow.id);
  }

  private buildPrompt(workflow: Workflow, data: any): string {
    let prompt = workflow.config.template;
    
    // Replace variables in template
    Object.entries(data).forEach(([key, value]) => {
      prompt = prompt.replace(`\${${key}}`, String(value));
    });

    return prompt;
  }

  private calculateNextRun(schedule: string, from: Date): Date {
    const next = new Date(from);
    switch (schedule) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
    }
    return next;
  }

  private async getDonorData(): Promise<any> {
    const { data: donors, error } = await this.supabase
      .from('donors')
      .select('*');

    if (error) throw error;

    const totalDonors = donors.length;
    const totalRevenue = donors.reduce((sum, donor) => sum + (Number(donor.amount) || 0), 0);
    const avgDonation = totalDonors > 0 ? totalRevenue / totalDonors : 0;

    // Calculate donor retention
    const uniqueDonors = new Set(donors.map(d => d.email));
    const returningDonors = donors.filter(d => {
      const donations = donors.filter(d2 => d2.email === d.email);
      return donations.length > 1;
    });
    const donorRetention = uniqueDonors.size > 0 
      ? (returningDonors.length / uniqueDonors.size) * 100 
      : 0;

    return {
      total_donors: totalDonors,
      total_revenue: totalRevenue,
      avg_donation: avgDonation,
      donor_retention: donorRetention,
    };
  }

  private async getGrantData(): Promise<any> {
    const { data: grantItems, error } = await this.supabase
      .from('writing_items')
      .select('*')
      .eq('type', 'grant');

    if (error) throw error;

    const activeGrants = grantItems.filter(g => g.status === 'in_review');
    const totalAmount = activeGrants.length; // Since we don't store amounts in writing_items
    const upcomingDeadlines = activeGrants
      .filter(g => new Date(g.updated_at) > new Date())
      .map(g => ({
        name: g.title,
        deadline: g.updated_at,
        amount: 'N/A', // Since we don't store amounts in writing_items
      }));

    return {
      active_grants: activeGrants.length,
      total_amount: totalAmount,
      upcoming_deadlines: upcomingDeadlines,
    };
  }

  private async getImpactData(): Promise<any> {
    const { data: projects, error } = await this.supabase
      .from('projects')
      .select('*');

    if (error) throw error;

    const activeProjects = projects.filter(p => p.status === 'active');
    const totalImpact = activeProjects.reduce((sum, project) => sum + (Number(project.impact_count) || 0), 0);
    const completionRate = activeProjects.reduce((sum, project) => sum + (Number(project.completion_rate) || 0), 0) / activeProjects.length;

    return {
      active_projects: activeProjects.length,
      total_impact: totalImpact,
      completion_rate: completionRate,
      projects: activeProjects.map(p => ({
        name: p.name,
        impact: p.impact_count,
        completion: p.completion_rate,
      })),
    };
  }

  private async getCampaignData(): Promise<any> {
    const { data: campaigns, error } = await this.supabase
      .from('campaigns')
      .select('*');

    if (error) throw error;

    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    const totalRaised = activeCampaigns.reduce((sum, campaign) => sum + (Number(campaign.amount_raised) || 0), 0);
    const totalGoal = activeCampaigns.reduce((sum, campaign) => sum + (Number(campaign.goal) || 0), 0);
    const performance = totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0;

    return {
      active_campaigns: activeCampaigns.length,
      total_raised: totalRaised,
      total_goal: totalGoal,
      performance: performance,
      campaigns: activeCampaigns.map(c => ({
        name: c.name,
        raised: c.amount_raised,
        goal: c.goal,
        progress: (Number(c.amount_raised) / Number(c.goal)) * 100,
      })),
    };
  }
} 