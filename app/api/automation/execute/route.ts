import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { WorkflowEngine } from '@/lib/workflowEngine';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { workflow } = await request.json();

    // Create the workflow in the database
    const { data: createdWorkflow, error: createError } = await supabase
      .from('workflows')
      .insert([workflow])
      .select()
      .single();

    if (createError) throw createError;

    // Initialize the workflow engine
    const engine = new WorkflowEngine(supabase);

    // Execute the workflow
    await engine.executeWorkflow(createdWorkflow);

    return NextResponse.json(createdWorkflow);
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
} 