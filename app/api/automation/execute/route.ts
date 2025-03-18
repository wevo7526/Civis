import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { WorkflowEngine } from '@/lib/workflowEngine';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workflowId } = body;

    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    // Get workflow details
    const { data: workflow, error } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching workflow:', error);
      return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 });
    }

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Execute workflow
    const engine = WorkflowEngine.getInstance();
    await engine.startWorkflow(workflow);

    return NextResponse.json({ 
      message: 'Workflow started successfully',
      workflow: {
        id: workflow.id,
        type: workflow.type,
        status: workflow.status,
        last_run: workflow.last_run,
        next_run: workflow.next_run,
      }
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 