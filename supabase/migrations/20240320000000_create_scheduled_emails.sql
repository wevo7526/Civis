-- Create scheduled_emails table
CREATE TABLE IF NOT EXISTS scheduled_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES outreach_templates(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status_date ON scheduled_emails(status, scheduled_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_scheduled_emails_updated_at
    BEFORE UPDATE ON scheduled_emails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scheduled emails"
    ON scheduled_emails FOR SELECT
    USING (auth.uid() = (SELECT user_id FROM outreach_templates WHERE id = template_id));

CREATE POLICY "Users can create scheduled emails"
    ON scheduled_emails FOR INSERT
    WITH CHECK (auth.uid() = (SELECT user_id FROM outreach_templates WHERE id = template_id));

CREATE POLICY "Users can update their own scheduled emails"
    ON scheduled_emails FOR UPDATE
    USING (auth.uid() = (SELECT user_id FROM outreach_templates WHERE id = template_id));

CREATE POLICY "Users can delete their own scheduled emails"
    ON scheduled_emails FOR DELETE
    USING (auth.uid() = (SELECT user_id FROM outreach_templates WHERE id = template_id)); 