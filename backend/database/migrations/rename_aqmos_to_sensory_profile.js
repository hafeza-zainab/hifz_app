// Migration script to rename aqmosProfile column to sensoryProfile in users table
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../quran.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        process.exit(1);
        return;
    }
    console.log("Connected to SQLite at:", dbPath);
});

db.serialize(() => {
    // Check if aqmosProfile column exists
    db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
            console.error("Failed to check users table schema:", err.message);
            db.close();
            process.exit(1);
            return;
        }

        const columnNames = columns.map(c => c.name);
        console.log("Users table columns:", columnNames);

        const hasAqmosProfile = columnNames.includes("aqmosProfile");
        const hasSensoryProfile = columnNames.includes("sensoryProfile");

        if (!hasAqmosProfile && hasSensoryProfile) {
            console.log("✓ sensoryProfile column already exists, aqmosProfile column does not exist. Migration already complete.");
            db.close();
            return;
        }

        if (!hasAqmosProfile && !hasSensoryProfile) {
            console.log("Neither aqmosProfile nor sensoryProfile column exists. Nothing to migrate.");
            db.close();
            return;
        }

        if (hasAqmosProfile && hasSensoryProfile) {
            console.log("Both columns exist. Dropping old aqmosProfile column...");
            db.run("ALTER TABLE users DROP COLUMN aqmosProfile", (err) => {
                if (err) {
                    console.error("Failed to drop aqmosProfile column:", err.message);
                    // If DROP COLUMN not supported, we need to recreate table
                    console.log("DROP COLUMN not supported. Using fallback method...");
                    fallbackMigration();
                } else {
                    console.log("✓ aqmosProfile column dropped successfully");
                    db.close();
                }
            });
            return;
        }

        // aqmosProfile exists, sensoryProfile does not - rename it
        console.log("Renaming aqmosProfile column to sensoryProfile...");
        db.run("ALTER TABLE users RENAME COLUMN aqmosProfile TO sensoryProfile", (err) => {
            if (err) {
                console.error("Failed to rename column (RENAME COLUMN not supported):", err.message);
                console.log("Using fallback method (add new column, copy data, drop old)...");
                fallbackMigration();
            } else {
                console.log("✓ Column renamed successfully from aqmosProfile to sensoryProfile");
                db.close();
            }
        });
    });
});

function fallbackMigration() {
    console.log("Starting fallback migration...");
    
    // Add new column
    db.run("ALTER TABLE users ADD COLUMN sensoryProfile TEXT", (err) => {
        if (err) {
            console.error("Failed to add sensoryProfile column:", err.message);
            db.close();
            process.exit(1);
            return;
        }
        console.log("✓ sensoryProfile column added");
        
        // Copy data from old column to new column
        db.run("UPDATE users SET sensoryProfile = aqmosProfile", (err) => {
            if (err) {
                console.error("Failed to copy data:", err.message);
                db.close();
                process.exit(1);
                return;
            }
            console.log("✓ Data copied from aqmosProfile to sensoryProfile");
            
            // Try to drop old column
            db.run("ALTER TABLE users DROP COLUMN aqmosProfile", (err) => {
                if (err) {
                    console.error("Failed to drop aqmosProfile column:", err.message);
                    console.log("Note: Old column aqmosProfile remains but data has been migrated to sensoryProfile");
                    console.log("Manual cleanup may be required if DROP COLUMN is not supported");
                } else {
                    console.log("✓ aqmosProfile column dropped successfully");
                }
                db.close();
            });
        });
    });
}
