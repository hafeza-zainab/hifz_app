const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../../database/quran.db");
const db = new sqlite3.Database(dbPath);

console.log("Checking Quran reference data in:", dbPath, "\n");

const quranTables = ["ayahs", "similarities"];

quranTables.forEach(tableName => {
    db.all(`SELECT COUNT(*) as count FROM ${tableName}`, [], (err, rows) => {
        if (err) {
            console.error(`Error counting ${tableName}:`, err.message);
        } else {
            console.log(`${tableName}: ${rows[0].count} rows`);
        }
    });
});

// Check if ayahs has page 1
db.all(`SELECT surah, ayah, page FROM ayahs WHERE page = 1 LIMIT 5`, [], (err, rows) => {
    if (err) {
        console.error("Error querying page 1:", err.message);
    } else {
        console.log(`\nSample ayahs from page 1: ${rows.length} found`);
        if (rows.length > 0) {
            console.log(rows);
        }
    }
});

setTimeout(() => {
    db.close();
}, 1000);
