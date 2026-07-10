//C:\quran-similarity-app\backend\config\database.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.resolve(__dirname, "../database/quran.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        process.exitCode = 1;
        return;
    }
    console.log("Connected to SQLite at:", dbPath);
});

const configureDatabase = () => {
    db.serialize(() => {
        db.run("PRAGMA journal_mode=WAL", (err) => {
            if (err) console.error("Failed to enable SQLite WAL mode:", err.message);
        });
        db.run("PRAGMA foreign_keys=ON", (err) => {
            if (err) console.error("Failed to enable SQLite foreign keys:", err.message);
        });

        // Create flashcard_folders table if not exists
        db.run(`
            CREATE TABLE IF NOT EXISTS flashcard_folders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                color TEXT DEFAULT '#1B4332',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error("Failed to create flashcard_folders table:", err.message);
            else console.log("✓ flashcard_folders table ready");
        });

        // Create flashcard_folder_items table if not exists
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
            if (err) console.error("Failed to create flashcard_folder_items table:", err.message);
            else console.log("✓ flashcard_folder_items table ready");
        });

        // Run Sensory Profile migration on startup
        db.all("PRAGMA table_info(users)", (err, columns) => {
            if (err) {
                console.error("Failed to check users table schema:", err.message);
                return;
            }

            const columnNames = columns.map(c => c.name);
            console.log("Users table columns:", columnNames);

            const hasSensoryProfile = columnNames.includes("sensoryProfile");

            if (!hasSensoryProfile) {
                console.log("Adding sensoryProfile column to users table...");
                db.run("ALTER TABLE users ADD COLUMN sensoryProfile TEXT", (err) => {
                    if (err) {
                        console.error("Failed to add sensoryProfile column:", err.message);
                    } else {
                        console.log("✓ sensoryProfile column added successfully");
                    }
                });
            } else {
                console.log("✓ sensoryProfile column already exists");
            }
        });
    });
};

configureDatabase();

const dbAsync = {
    run: (sql, params = []) =>
        new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        }),

    all: (sql, params = []) =>
        new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),

    get: (sql, params = []) =>
        new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        }),

    close: () =>
        new Promise((resolve, reject) => {
            db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        }),

    transaction: async (fn) => {
        await dbAsync.run("BEGIN TRANSACTION");
        try {
            const result = await fn(dbAsync);
            await dbAsync.run("COMMIT");
            return result;
        } catch (err) {
            try {
                await dbAsync.run("ROLLBACK");
            } catch (rollbackErr) {
                err.rollbackError = rollbackErr;
            }
            throw err;
        }
    },
};

module.exports = dbAsync;
