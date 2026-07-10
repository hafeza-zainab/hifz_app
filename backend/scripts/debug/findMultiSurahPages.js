const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../../database/quran.db");
const db = new sqlite3.Database(dbPath);

console.log("Finding pages with multiple surahs:\n");

db.all(
    `SELECT page, COUNT(DISTINCT surah) as surah_count 
     FROM ayahs 
     GROUP BY page 
     HAVING surah_count > 1 
     ORDER BY surah_count DESC 
     LIMIT 20`,
    [],
    (err, rows) => {
        if (err) {
            console.error("Error:", err.message);
            process.exit(1);
        }
        
        console.log("Pages with multiple surahs:");
        rows.forEach(r => {
            console.log(`  Page ${r.page}: ${r.surah_count} surahs`);
        });
        
        // Get details for a page with exactly 2 surahs for testing
        db.get(
            `SELECT page, COUNT(DISTINCT surah) as surah_count 
             FROM ayahs 
             GROUP BY page 
             HAVING surah_count = 2 
             LIMIT 1`,
            [],
            (err, row) => {
                if (err) {
                    console.error("Error:", err.message);
                    process.exit(1);
                }
                
                if (row) {
                    console.log(`\nTesting page ${row.page} (exactly 2 surahs):`);
                    
                    db.all(
                        `SELECT a.surah, a.name, a.juz, a.ayah
                         FROM ayahs a
                         WHERE a.page = ?
                         ORDER BY a.surah ASC, a.ayah ASC`,
                        [row.page],
                        (err, rows) => {
                            if (err) {
                                console.error("Error:", err.message);
                                process.exit(1);
                            }
                            
                            const surahMap = new Map();
                            for (const row of rows) {
                                if (!surahMap.has(row.surah)) {
                                    surahMap.set(row.surah, { surah: row.surah, name: row.name, juz: row.juz, ayahs: [] });
                                }
                                surahMap.get(row.surah).ayahs.push(row.ayah);
                            }
                            
                            const result = { surahs: [...surahMap.values()] };
                            console.log(JSON.stringify(result, null, 2));
                            
                            db.close();
                            process.exit();
                        }
                    );
                } else {
                    console.log("\nNo page with exactly 2 surahs found");
                    db.close();
                    process.exit();
                }
            }
        );
    }
);
