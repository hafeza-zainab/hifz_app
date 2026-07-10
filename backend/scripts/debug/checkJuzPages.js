const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../../database/quran.db");
const db = new sqlite3.Database(dbPath);

console.log("Pages per Juz:\n");

db.all('SELECT juz, COUNT(DISTINCT page) as page_count, MIN(page) as min_page, MAX(page) as max_page FROM ayahs GROUP BY juz ORDER BY juz', [], (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  
  rows.forEach(r => {
    console.log(`Juz ${r.juz}: ${r.page_count} pages (range: ${r.min_page}-${r.max_page})`);
  });
  
  db.close();
  process.exit();
});
