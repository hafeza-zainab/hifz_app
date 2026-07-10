-- ============================================================
-- Add structured page/juz columns to diary_logs for Jadeed logs
-- ============================================================
-- This migration adds columns to store the structured page/juz data
-- that the Jadeed form already collects but was previously being
-- flattened into TEXT strings only.
--
-- These columns are nullable and will only be populated for type='jadeed'
-- records. Other log types (murajah, tasmee, ikhtebar, Juz_Hali) are
-- unaffected and will continue to work exactly as before.
-- ============================================================

ALTER TABLE diary_logs ADD COLUMN start_page INTEGER;
ALTER TABLE diary_logs ADD COLUMN finish_page INTEGER;
ALTER TABLE diary_logs ADD COLUMN start_juz INTEGER;
ALTER TABLE diary_logs ADD COLUMN finish_juz INTEGER;
