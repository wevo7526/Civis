import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's email settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_email_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .order('is_default', { ascending: false });

    if (settingsError) {
      throw settingsError;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      sender_name,
      sender_email,
      reply_to_email,
      organization_name,
      organization_address,
      organization_phone,
      organization_website,
      sendgrid_api_key,
      is_default
    } = body;

    // Validate required fields
    if (!sender_name || !sender_email || !sendgrid_api_key) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Test SendGrid API key
    sgMail.setApiKey(sendgrid_api_key);
    try {
      await sgMail.send({
        to: sender_email,
        from: sender_email,
        subject: 'Test Email',
        text: 'This is a test email to verify your SendGrid configuration.'
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid SendGrid API key' },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await supabase
        .from('user_email_settings')
        .update({ is_default: false })
        .eq('user_id', session.user.id);
    }

    // Create new email settings
    const { data: settings, error: insertError } = await supabase
      .from('user_email_settings')
      .insert([
        {
          user_id: session.user.id,
          sender_name,
          sender_email,
          reply_to_email,
          organization_name,
          organization_address,
          organization_phone,
          organization_website,
          sendgrid_api_key,
          is_default: is_default || false
        }
      ])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error creating email settings:', error);
    return NextResponse.json(
      { error: 'Failed to create email settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      id,
      sender_name,
      sender_email,
      reply_to_email,
      organization_name,
      organization_address,
      organization_phone,
      organization_website,
      sendgrid_api_key,
      is_default
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing settings ID' },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await supabase
        .from('user_email_settings')
        .update({ is_default: false })
        .eq('user_id', session.user.id)
        .neq('id', id);
    }

    // Update email settings
    const { data: settings, error: updateError } = await supabase
      .from('user_email_settings')
      .update({
        sender_name,
        sender_email,
        reply_to_email,
        organization_name,
        organization_address,
        organization_phone,
        organization_website,
        sendgrid_api_key,
        is_default: is_default || false
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating email settings:', error);
    return NextResponse.json(
      { error: 'Failed to update email settings' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing settings ID' },
        { status: 400 }
      );
    }

    // Delete email settings
    const { error: deleteError } = await supabase
      .from('user_email_settings')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting email settings:', error);
    return NextResponse.json(
      { error: 'Failed to delete email settings' },
      { status: 500 }
    );
  }
} 