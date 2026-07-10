const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../quran.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        process.exit(1);
    }
    console.log("Connected to SQLite at:", dbPath);
});

db.serialize(() => {
    // Check if column exists
    db.all("PRAGMA table_info(scheduler_events)", (err, columns) => {
        if (err) {
            console.error("Error checking table info:", err.message);
            db.close();
            process.exit(1);
        }
        
        const hasColumn = columns.some(col => col.name === 'source_template');
        
        if (hasColumn) {
            console.log("✅ source_template column already exists");
            db.close();
            return;
        }
        
        // Add the column
        db.run("ALTER TABLE scheduler_events ADD COLUMN source_template TEXT", (err) => {
            if (err) {
                console.error("Failed to add source_template column:", err.message);
            } else {
                console.log("✅ source_template column added successfully");
            }
            
            db.close((err) => {
                if (err) {
                    console.error("Error closing database:", err.message);
                } else {
                    console.log("Database connection closed");
                }
            });
        });
    });
});
