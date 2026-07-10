-- ============================================================
-- Takhteet (Jadeed planning/progress) goals table
-- ============================================================
-- Stores monthly Jadeed memorization goals with weekly milestones
-- Used by the Takhteet feature to track progress against targets
-- ============================================================

CREATE TABLE IF NOT EXISTS takhteet_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    start_juz INTEGER NOT NULL,
    start_page INTEGER NOT NULL,
    target_juz INTEGER NOT NULL,
    target_page INTEGER NOT NULL,
    week1_juz INTEGER,
    week1_page INTEGER,
    week2_juz INTEGER,
    week2_page INTEGER,
    week3_juz INTEGER,
    week3_page INTEGER,
    week4_juz INTEGER,
    week4_page INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT,
    UNIQUE(user_id, year, month),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_takhteet_goals_user_year_month ON takhteet_goals(user_id, year, month);
