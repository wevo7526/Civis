-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own stakeholders" ON stakeholders;
DROP POLICY IF EXISTS "Users can insert their own stakeholders" ON stakeholders;
DROP POLICY IF EXISTS "Users can update their own stakeholders" ON stakeholders;
DROP POLICY IF EXISTS "Users can delete their own stakeholders" ON stakeholders;

-- Create stakeholders table first
CREATE TABLE stakeholders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    organization TEXT,
    notes TEXT,
    engagement_score INTEGER NOT NULL,
    last_contact DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add type constraint after table creation
ALTER TABLE stakeholders ADD CONSTRAINT stakeholders_type_check 
    CHECK (type IN ('individual', 'organization', 'government', 'media', 'community'));

-- Add engagement score constraint
ALTER TABLE stakeholders ADD CONSTRAINT stakeholders_engagement_score_check 
    CHECK (engagement_score >= 0 AND engagement_score <= 100);

-- Create indexes
CREATE INDEX stakeholders_user_id_idx ON stakeholders(user_id);
CREATE INDEX stakeholders_type_idx ON stakeholders(type);
CREATE INDEX stakeholders_engagement_score_idx ON stakeholders(engagement_score);
CREATE INDEX stakeholders_last_contact_idx ON stakeholders(last_contact);

-- Enable Row Level Security
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own stakeholders"
    ON stakeholders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stakeholders"
    ON stakeholders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stakeholders"
    ON stakeholders FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stakeholders"
    ON stakeholders FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_stakeholders_updated_at
    BEFORE UPDATE ON stakeholders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 