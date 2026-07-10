// backend/scripts/maintenance/addAqmosProfileColumn.js
//
// Migration script to add aqmosProfile column to users table
// This script is idempotent - it can be run multiple times safely

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.resolve(__dirname, "../../database/quran.db");

async function runMigration() {
    const db = new sqlite3.Database(dbPath);

    try {
        console.log("=== AQMOS PROFILE COLUMN MIGRATION ===");
        console.log("Database path:", dbPath);

        // Check if column already exists
        const columns = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(users)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        console.log("Current users table columns:", columns.map(c => c.name));

        const hasAqmosProfile = columns.some(c => c.name === "aqmosProfile");

        if (hasAqmosProfile) {
            console.log("✓ aqmosProfile column already exists - skipping migration");
            return;
        }

        console.log("Adding aqmosProfile column to users table...");

        // Add the column
        await new Promise((resolve, reject) => {
            db.run("ALTER TABLE users ADD COLUMN aqmosProfile TEXT", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log("✓ aqmosProfile column added successfully");

        // Verify the column was added
        const newColumns = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(users)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        console.log("Updated users table columns:", newColumns.map(c => c.name));
        console.log("======================================");

    } catch (error) {
        console.error("Migration failed:", error);
        throw error;
    } finally {
        db.close();
    }
}

// Run migration if called directly
if (require.main === module) {
    runMigration()
        .then(() => {
            console.log("Migration completed successfully");
            process.exit(0);
        })
        .catch((error) => {
            console.error("Migration failed:", error);
            process.exit(1);
        });
}

module.exports = { runMigration };
