import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all templates for the user
    const { data: templates, error: templateError } = await supabase
      .from('outreach_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (templateError) throw templateError;

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error in GET /api/outreach/templates:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.json();
    const {
      name,
      description,
      type,
      subject,
      content,
      schedule
    } = body;

    // Validate required fields
    if (!name || !type || !subject || !content || !schedule) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the template
    const { data: template, error: templateError } = await supabase
      .from('outreach_templates')
      .insert([{
        user_id: user.id,
        name,
        description,
        type,
        subject,
        content,
        schedule,
        status: schedule === 'immediate' ? 'active' : 'draft'
      }])
      .select()
      .single();

    if (templateError) throw templateError;

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error in POST /api/outreach/templates:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.json();
    const {
      id,
      name,
      description,
      type,
      subject,
      content,
      schedule,
      status
    } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Update the template
    const { data: template, error: templateError } = await supabase
      .from('outreach_templates')
      .update({
        name,
        description,
        type,
        subject,
        content,
        schedule,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (templateError) throw templateError;

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error in PUT /api/outreach/templates:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the template ID from the URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Delete the template
    const { error: templateError } = await supabase
      .from('outreach_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (templateError) throw templateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/outreach/templates:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 