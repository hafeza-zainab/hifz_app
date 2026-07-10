-- Add source_template column to scheduler_events table
-- This column tracks which template an event came from for proper template replacement

ALTER TABLE scheduler_events ADD COLUMN source_template TEXT;
