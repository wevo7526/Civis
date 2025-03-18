import { createClient } from '@supabase/supabase-js';
import { Anthropic } from '@anthropic-ai/sdk';

interface WorkflowConfig {
  type: string;
  schedule: string;
  template: string;
  metrics?: string[];
}

interface Workflow {
  id: string;
  user_id: string;
  type: string;
  status: 'active' | 'inactive';
  config: WorkflowConfig;
  last_run?: string;
  next_run?: string;
}

export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private supabase;
  private anthropic;
  private runningWorkflows: Map<string, NodeJS.Timeout>;

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
    try {
      // Get relevant data based on workflow type
      const data = await this.getWorkflowData(workflow);
      
      // Generate content using AI
      const content = await this.generateContent(workflow, data);
      
      // Send notifications/updates
      await this.sendUpdates(workflow, content);
      
      // Update workflow status
      await this.updateWorkflowStatus(workflow);
    } catch (error) {
      console.error(`Error executing workflow ${workflow.id}:`, error);
      throw error;
    }
  }

  private async getWorkflowData(workflow: Workflow): Promise<any> {
    switch (workflow.type) {
      case 'donor-communications':
        return this.getDonorData();
      case 'grant-reminders':
        return this.getGrantData();
      case 'impact-reports':
        return this.getImpactData();
      default:
        return {};
    }
  }

  private async getDonorData(): Promise<any> {
    const { data: donations, error } = await this.supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return {
      recent_donations: donations,
      total_amount: donations.reduce((sum, d) => sum + d.amount, 0),
      donor_count: donations.length,
    };
  }

  private async getGrantData(): Promise<any> {
    const { data: grants, error } = await this.supabase
      .from('grants')
      .select('*')
      .order('deadline', { ascending: true })
      .limit(5);

    if (error) throw error;

    return {
      upcoming_deadlines: grants,
      total_grants: grants.length,
      next_deadline: grants[0]?.deadline,
    };
  }

  private async getImpactData(): Promise<any> {
    const { data: metrics, error } = await this.supabase
      .from('impact_metrics')
      .select('*')
      .order('date', { ascending: false })
      .limit(1);

    if (error) throw error;

    return {
      current_metrics: metrics[0],
      total_impact: metrics[0]?.total_impact || 0,
      program_outcomes: metrics[0]?.program_outcomes || [],
    };
  }

  private async generateContent(workflow: Workflow, data: any): Promise<string> {
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

  private buildPrompt(workflow: Workflow, data: any): string {
    let prompt = workflow.config.template;
    
    // Replace variables in template
    Object.entries(data).forEach(([key, value]) => {
      prompt = prompt.replace(`\${${key}}`, String(value));
    });

    return prompt;
  }

  private async sendUpdates(workflow: Workflow, content: string): Promise<void> {
    // Implement notification sending logic here
    // This could be email, SMS, or other channels
    console.log(`Sending update for workflow ${workflow.id}:`, content);
  }

  private async updateWorkflowStatus(workflow: Workflow): Promise<void> {
    const now = new Date();
    const nextRun = this.calculateNextRun(workflow.config.schedule, now);

    await this.supabase
      .from('automation_workflows')
      .update({
        last_run: now.toISOString(),
        next_run: nextRun.toISOString(),
      })
      .eq('id', workflow.id);
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
} 