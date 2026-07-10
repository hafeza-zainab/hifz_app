-- Migration: Add has_seen_walkthrough column to users table
-- NOTE: This column is now in schema.sql. This migration is kept for backward compatibility
-- with existing databases that may not have the column yet.
-- If the column already exists, this migration will be skipped.

-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we need to handle this
-- The setup.js script should check if the column exists before running this migration
