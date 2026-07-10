-- ============================================================
--C:\quran-similarity-app\backend\database\schema.sql
-- Quran Similarity App — Master Schema
-- Single source of truth. Run via: node scripts/Setup.js
-- ============================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- Core Quran data
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ayahs (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    surah    INTEGER NOT NULL,
    ayah     INTEGER NOT NULL,
    text     TEXT    NOT NULL,
    juz      INTEGER NOT NULL,
    marhala  TEXT    NOT NULL,
    name     TEXT,
    page     INTEGER,
    UNIQUE(surah, ayah)
);

CREATE TABLE IF NOT EXISTS similarities (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    source_surah     INTEGER NOT NULL,
    source_ayah      INTEGER NOT NULL,
    source_page      INTEGER,
    target_surah     INTEGER NOT NULL,
    target_ayah      INTEGER NOT NULL,
    target_page      INTEGER,
    similarity_score REAL    NOT NULL,
    tips             TEXT    DEFAULT '[]',
    UNIQUE(source_surah, source_ayah, target_surah, target_ayah)
);

-- ------------------------------------------------------------
-- Users
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    username            TEXT    UNIQUE NOT NULL,
    email               TEXT    UNIQUE NOT NULL,
    password            TEXT    NOT NULL,
    has_seen_walkthrough INTEGER NOT NULL DEFAULT 0,
    sensoryProfile      TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Diary
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS diary_logs (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER  NOT NULL,
    type        TEXT     NOT NULL CHECK(type IN ('murajah','tasmee','ikhtebar','jadeed','Juz_Hali')),
    range_from  TEXT     NOT NULL,
    range_to    TEXT     NOT NULL DEFAULT '',
    score       INTEGER  NOT NULL CHECK(score >= 0 AND score <= 10),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ------------------------------------------------------------
-- Tasks
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tasks (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER  NOT NULL,
    title      TEXT     NOT NULL,
    category   TEXT     NOT NULL CHECK(category IN ('murajah','jadeed','Juz_Hali','tasmee','general')),
    status     TEXT     NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed')),
    date       TEXT     NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Themes / Streaks
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_themes (
    id             INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER  NOT NULL,
    theme_id       TEXT     NOT NULL,
    streak         INTEGER  NOT NULL DEFAULT 0,
    max_streak     INTEGER  NOT NULL DEFAULT 0,
    frozen_streak  INTEGER  NOT NULL DEFAULT 0,
    last_log_date  TEXT,
    is_active      INTEGER  NOT NULL DEFAULT 0,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, theme_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- COACH SESSIONS (for Ustadh AI coach feature)
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_sessions (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER  NOT NULL,
    title      TEXT     NOT NULL DEFAULT 'New Session',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER  NOT NULL,
    role       TEXT     NOT NULL CHECK(role IN ('user', 'assistant')),
    content    TEXT     NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- ============================================================
-- FLASHCARDS (for user-generated flashcard sets)
-- ============================================================

CREATE TABLE IF NOT EXISTS flashcard_sets (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER  NOT NULL,
    name       TEXT     NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS flashcard_cards (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    set_id INTEGER NOT NULL,
    front  TEXT    NOT NULL,
    back   TEXT    NOT NULL,
    FOREIGN KEY(set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS flashcard_questions (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    set_id     INTEGER  NOT NULL,
    text       TEXT     NOT NULL,
    answer     TEXT,
    is_fixed   INTEGER  NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS flashcard_answers (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER  NOT NULL,
    question_id INTEGER  NOT NULL,
    user_answer TEXT     NOT NULL,
    is_correct  INTEGER,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(question_id) REFERENCES flashcard_questions(id) ON DELETE CASCADE
);

-- ============================================================
-- COACH MESSAGES (legacy - for compatibility)
-- ============================================================

CREATE TABLE IF NOT EXISTS coach_messages (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER  NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- Add this table to schema.sql after line 190 (before the closing):

-- ============================================================
-- HEATMAP / SIPARA DATA
-- ============================================================

CREATE TABLE IF NOT EXISTS heatmap_scores (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER  NOT NULL,
    sipara     INTEGER  NOT NULL,
    page_number INTEGER NOT NULL,
    quran_page  INTEGER NOT NULL,
    score      REAL     NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, sipara, page_number),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_heatmap_user_sipara ON heatmap_scores(user_id, sipara);

-- ============================================================
-- SCHEDULER (for intelligent time management)
-- ============================================================

CREATE TABLE IF NOT EXISTS scheduler_events (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    days_of_week TEXT NOT NULL,
    recurrence TEXT NOT NULL DEFAULT 'none',
    is_fixed INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'medium',
    location TEXT,
    notes TEXT,
    source_template TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scheduler_events_user ON scheduler_events(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduler_events_active ON scheduler_events(user_id, is_active);

CREATE TABLE IF NOT EXISTS scheduler_revision_units (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    work_type TEXT NOT NULL,
    sipara INTEGER NOT NULL,
    pages TEXT NOT NULL,
    page_range TEXT,
    aqmos_quality TEXT NOT NULL,
    aqmos_score REAL NOT NULL,
    revision_method TEXT,
    revision_steps TEXT,
    estimated_time INTEGER NOT NULL,
    min_time INTEGER NOT NULL,
    max_time INTEGER NOT NULL,
    priority REAL NOT NULL,
    priority_factors TEXT,
    is_splittable INTEGER NOT NULL DEFAULT 1,
    is_scheduled INTEGER NOT NULL DEFAULT 0,
    scheduled_slots TEXT,
    requires_units TEXT,
    conflicts_with TEXT,
    generated_at INTEGER NOT NULL,
    scheduled_at INTEGER,
    completed_at INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_revision_units_user ON scheduler_revision_units(user_id);
CREATE INDEX IF NOT EXISTS idx_revision_units_work_type ON scheduler_revision_units(user_id, work_type);
CREATE INDEX IF NOT EXISTS idx_revision_units_scheduled ON scheduler_revision_units(user_id, is_scheduled);
CREATE INDEX IF NOT EXISTS idx_revision_units_priority ON scheduler_revision_units(user_id, priority);

CREATE TABLE IF NOT EXISTS scheduler_page_analysis (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    sipara INTEGER NOT NULL,
    page INTEGER NOT NULL,
    aqmos_quality TEXT NOT NULL,
    aqmos_score REAL NOT NULL,
    mistake_pattern TEXT,
    weakness_areas TEXT,
    last_revision_date INTEGER,
    days_since_revision INTEGER,
    revision_count INTEGER DEFAULT 0,
    average_score REAL,
    score_trend TEXT,
    consecutive_weak_pages INTEGER DEFAULT 0,
    consecutive_good_pages INTEGER DEFAULT 0,
    base_time_estimate INTEGER NOT NULL,
    time_adjustment INTEGER DEFAULT 0,
    final_time_estimate INTEGER NOT NULL,
    analyzed_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(user_id, sipara, page),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_page_analysis_user ON scheduler_page_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_page_analysis_sipara ON scheduler_page_analysis(user_id, sipara);

CREATE TABLE IF NOT EXISTS scheduler_schedules (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    week_start INTEGER NOT NULL,
    schedule TEXT NOT NULL,
    generated_at INTEGER NOT NULL,
    algorithm_version TEXT NOT NULL,
    weekly_workload TEXT,
    conflicts TEXT,
    warnings TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scheduler_schedules_user_week ON scheduler_schedules(user_id, week_start);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_similarities_source  ON similarities(source_surah, source_ayah);
CREATE INDEX IF NOT EXISTS idx_similarities_target  ON similarities(target_surah, target_ayah);
CREATE INDEX IF NOT EXISTS idx_ayahs_juz            ON ayahs(juz);
CREATE INDEX IF NOT EXISTS idx_ayahs_page           ON ayahs(page);
CREATE INDEX IF NOT EXISTS idx_diary_user_date      ON diary_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date      ON tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_themes_user_active   ON user_themes(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user   ON chat_sessions(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_coach_messages_user_date ON coach_messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user  ON flashcard_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_cards_set  ON flashcard_cards(set_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_questions_set ON flashcard_questions(set_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_answers_user_question ON flashcard_answers(user_id, question_id);
