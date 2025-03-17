import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ChatAnthropic } from '@langchain/anthropic';

const model = new ChatAnthropic({
  modelName: 'claude-3-opus-20240229',
  temperature: 0.7,
  maxTokens: 4000,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_name, project_description } = await request.json();

    if (!project_name || !project_description) {
      return NextResponse.json(
        { error: 'Project name and description are required' },
        { status: 400 }
      );
    }

    // Fetch related data for context
    const [projectsResponse, grantsResponse, eventsResponse] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', user.id),
      supabase.from('writing_items').select('*').eq('user_id', user.id).eq('type', 'grant'),
      supabase.from('events').select('*').eq('user_id', user.id),
    ]);

    const projects = projectsResponse.data || [];
    const grants = grantsResponse.data || [];
    const events = eventsResponse.data || [];

    // Construct system message with context
    const systemMessage = `You are an expert nonprofit consultant helping to improve project planning and grant writing.
    Analyze the project details and provide specific, actionable suggestions for:
    1. Impact statement that aligns with grant requirements
    2. Budget recommendations based on similar projects
    3. Timeline suggestions considering grant deadlines and events

    Context:
    - Total Projects: ${projects.length}
    - Active Grants: ${grants.filter(g => g.status === 'draft').length}
    - Upcoming Events: ${events.filter(e => new Date(e.date) > new Date()).length}`;

    // Generate suggestions
    const prompt = `Project Name: ${project_name}
    Description: ${project_description}

    Please provide specific suggestions for:
    1. A compelling impact statement that highlights measurable outcomes
    2. Budget recommendations based on similar projects and grant requirements
    3. Timeline suggestions that align with grant deadlines and events`;

    const response = await model.invoke(prompt);

    // Parse and structure the response
    const suggestions = {
      impact_statement: response.content,
      budget_recommendation: response.content,
      timeline_suggestion: response.content,
    };

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
} 