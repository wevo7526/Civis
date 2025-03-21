-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
    id BIGSERIAL PRIMARY KEY,
    ip TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on ip for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits(ip);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_rate_limits_updated_at
    BEFORE UPDATE ON rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role can do everything" ON rate_limits
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read their own rate limits
CREATE POLICY "Users can read their own rate limits" ON rate_limits
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to update their own rate limits
CREATE POLICY "Users can update their own rate limits" ON rate_limits
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to insert their own rate limits
CREATE POLICY "Users can insert their own rate limits" ON rate_limits
    FOR INSERT
    TO authenticated
    WITH CHECK (true); 