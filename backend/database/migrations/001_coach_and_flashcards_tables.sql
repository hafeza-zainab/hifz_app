-- database/migrations/001_coach_and_flashcard_tables.sql
-- Applied automatically by scripts/setup.js
-- Add new feature tables here in the future as 002_..., 003_... etc.

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

CREATE TABLE IF NOT EXISTS coach_messages (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER  NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS flashcard_sets (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER  NOT NULL,
    name       TEXT     NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS flashcard_cards (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    set_id INTEGER NOT NULL,
    front  TEXT    NOT NULL,
    back   TEXT    NOT NULL,
    FOREIGN KEY(set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user     ON chat_sessions(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session  ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_coach_messages_user    ON coach_messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user    ON flashcard_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_cards_set    ON flashcard_cards(set_id);