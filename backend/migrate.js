const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.resolve(__dirname, "./database/quran.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        process.exit(1);
    }
    console.log("Connected to SQLite at:", dbPath);
});

db.serialize(() => {
    // Create flashcard_folders table
    db.run(`
        CREATE TABLE IF NOT EXISTS flashcard_folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            color TEXT DEFAULT '#1B4332',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error("Failed to create flashcard_folders table:", err.message);
        } else {
            console.log("✅ flashcard_folders table created successfully");
        }
    });

    // Create flashcard_folder_items table
    db.run(`
        CREATE TABLE IF NOT EXISTS flashcard_folder_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            folder_id INTEGER NOT NULL,
            set_id TEXT NOT NULL,
            set_type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (folder_id) REFERENCES flashcard_folders(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error("Failed to create flashcard_folder_items table:", err.message);
        } else {
            console.log("✅ flashcard_folder_items table created successfully");
        }
    });

    // Close database connection after all operations
    db.close((err) => {
        if (err) {
            console.error("Error closing database:", err.message);
        } else {
            console.log("Database connection closed");
        }
    });
});
