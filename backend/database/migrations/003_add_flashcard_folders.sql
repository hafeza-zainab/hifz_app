-- Migration 003: Add flashcard folder system
-- This adds tables for organizing flashcard sets into folders

CREATE TABLE IF NOT EXISTS flashcard_folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#1B4332',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS flashcard_folder_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folder_id INTEGER NOT NULL,
  set_id TEXT NOT NULL,
  set_type TEXT NOT NULL,
  FOREIGN KEY (folder_id) REFERENCES flashcard_folders(id) ON DELETE CASCADE
);

-- Index for faster folder lookups by user
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON flashcard_folders(user_id);

-- Index for faster folder item lookups
CREATE INDEX IF NOT EXISTS idx_folder_items_folder_id ON flashcard_folder_items(folder_id);
