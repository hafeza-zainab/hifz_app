-- ============================================================
-- Add late-set tracking columns to takhteet_goals table
-- ============================================================
-- These columns support the late-set feature where goals set
-- after day 5 of the month track from the set date instead of day 1
-- ============================================================

-- Add goal_set_date: UTC timestamp when the goal was set
ALTER TABLE takhteet_goals ADD COLUMN goal_set_date TEXT;

-- Add is_late: boolean flag indicating if goal was set after day 5
ALTER TABLE takhteet_goals ADD COLUMN is_late INTEGER DEFAULT 0;

-- Add tracking_start_date: UTC date from which progress is calculated
-- (defaults to 1st of month for on-time goals, set date for late goals)
ALTER TABLE takhteet_goals ADD COLUMN tracking_start_date TEXT;

-- Backfill existing goals: set goal_set_date = created_at, is_late = 0, tracking_start_date = 1st of month
UPDATE takhteet_goals 
SET goal_set_date = created_at,
    is_late = 0,
    tracking_start_date = strftime('%Y-%m-%d', created_at, 'start of month')
WHERE goal_set_date IS NULL;
