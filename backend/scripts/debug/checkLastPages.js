const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../../database/quran.db");
const db = new sqlite3.Database(dbPath);

console.log("Checking last pages with data:\n");

db.all(
    `SELECT page, COUNT(*) as count FROM ayahs GROUP BY page ORDER BY page DESC LIMIT 10`,
    [],
    (err, rows) => {
        if (err) {
            console.error("Error:", err.message);
            process.exit(1);
        }
        
        console.log("Last 10 pages with data:");
        rows.forEach(r => {
            console.log(`  Page ${r.page}: ${r.count} ayahs`);
        });
        
        // Check page 522 specifically for multiple surahs
        db.all(
            `SELECT a.surah, a.name, a.juz, a.ayah
             FROM ayahs a
             WHERE a.page = 522
             ORDER BY a.surah ASC, a.ayah ASC`,
            [],
            (err, rows) => {
                if (err) {
                    console.error("Error:", err.message);
                    process.exit(1);
                }
                
                console.log(`\nPage 522 details (${rows.length} ayahs):`);
                const surahMap = new Map();
                for (const row of rows) {
                    if (!surahMap.has(row.surah)) {
                        surahMap.set(row.surah, { surah: row.surah, name: row.name, juz: row.juz, ayahs: [] });
                    }
                    surahMap.get(row.surah).ayahs.push(row.ayah);
                }
                
                const surahs = [...surahMap.values()];
                console.log(`Number of surahs on page 522: ${surahs.length}`);
                surahs.forEach(s => {
                    console.log(`  Surah ${s.surah}: ${s.name} (${s.ayahs.length} ayahs)`);
                });
                
                db.close();
                process.exit();
            }
        );
    }
);
