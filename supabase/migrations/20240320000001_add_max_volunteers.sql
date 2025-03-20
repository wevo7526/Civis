-- Add max_volunteers column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS max_volunteers INTEGER;

-- Add volunteer_ids column if it doesn't exist
ALTER TABLE events
ADD COLUMN IF NOT EXISTS volunteer_ids UUID[] DEFAULT '{}';

-- Add volunteer_hours column if it doesn't exist
ALTER TABLE events
ADD COLUMN IF NOT EXISTS volunteer_hours JSONB DEFAULT '{}'; 