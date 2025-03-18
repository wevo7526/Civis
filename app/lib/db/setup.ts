import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function setupAutomationTables() {
  try {
    // Create automation_workflows table
    const { error: createTableError } = await supabase.rpc('create_automation_workflows_table', {
      sql: `
        create table if not exists public.automation_workflows (
          id uuid default gen_random_uuid() primary key,
          user_id uuid references auth.users(id) on delete cascade,
          type text not null,
          status text not null default 'inactive',
          config jsonb not null default '{}'::jsonb,
          last_run timestamp with time zone,
          next_run timestamp with time zone,
          created_at timestamp with time zone default timezone('utc'::text, now()) not null,
          updated_at timestamp with time zone default timezone('utc'::text, now()) not null
        );

        -- Set up RLS (Row Level Security)
        alter table public.automation_workflows enable row level security;

        -- Create policy to allow users to only see their own workflows
        create policy "Users can only view their own workflows"
          on public.automation_workflows for select
          using (auth.uid() = user_id);

        -- Create policy to allow users to insert their own workflows
        create policy "Users can insert their own workflows"
          on public.automation_workflows for insert
          with check (auth.uid() = user_id);

        -- Create policy to allow users to update their own workflows
        create policy "Users can update their own workflows"
          on public.automation_workflows for update
          using (auth.uid() = user_id);

        -- Create policy to allow users to delete their own workflows
        create policy "Users can delete their own workflows"
          on public.automation_workflows for delete
          using (auth.uid() = user_id);

        -- Create function to update updated_at timestamp
        create or replace function public.handle_updated_at()
        returns trigger as $$
        begin
          new.updated_at = timezone('utc'::text, now());
          return new;
        end;
        $$ language plpgsql;

        -- Create trigger to automatically update updated_at
        create trigger handle_updated_at
          before update on public.automation_workflows
          for each row
          execute function public.handle_updated_at();
      `
    });

    if (createTableError) {
      console.error('Error creating automation_workflows table:', createTableError);
      throw createTableError;
    }

    console.log('Successfully created automation_workflows table');
  } catch (error) {
    console.error('Error setting up automation tables:', error);
    throw error;
  }
}

export async function setupAITables() {
  try {
    // Create AI interactions table
    const { error: aiInteractionsError } = await supabase.rpc('create_ai_interactions_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS ai_interactions (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) NOT NULL,
          action TEXT NOT NULL,
          prompt TEXT NOT NULL,
          response TEXT NOT NULL,
          context JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Enable RLS
        ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view their own AI interactions"
          ON ai_interactions FOR SELECT
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own AI interactions"
          ON ai_interactions FOR INSERT
          WITH CHECK (auth.uid() = user_id);

        -- Create index for faster queries
        CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_interactions(created_at);
      `
    });

    if (aiInteractionsError) {
      console.error('Error creating AI interactions table:', aiInteractionsError);
      throw aiInteractionsError;
    }

    console.log('AI tables setup completed successfully');
  } catch (error) {
    console.error('Error in setupAITables:', error);
    throw error;
  }
} 