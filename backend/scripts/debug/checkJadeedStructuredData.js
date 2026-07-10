const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../../database/quran.db");
const db = new sqlite3.Database(dbPath);

console.log("Checking Jadeed logs for structured page data:\n");

db.all(`SELECT COUNT(*) as total FROM diary_logs WHERE type = 'jadeed'`, [], (err, rows) => {
  if (err) {
    console.error("Error counting jadeed logs:", err.message);
    process.exit(1);
  }
  
  const total = rows[0].total;
  console.log(`Total Jadeed logs: ${total}`);
  
  db.all(`SELECT COUNT(*) as with_data FROM diary_logs WHERE type = 'jadeed' AND start_page IS NOT NULL`, [], (err, rows) => {
    if (err) {
      console.error("Error counting with structured data:", err.message);
      process.exit(1);
    }
    
    const withData = rows[0].with_data;
    const withoutData = total - withData;
    
    console.log(`With structured data (start_page populated): ${withData}`);
    console.log(`Without structured data (start_page NULL): ${withoutData}`);
    
    if (withoutData > 0) {
      console.log("\n⚠️  Takhteet progress endpoint should filter out NULL start_page rows");
    } else {
      console.log("\n✓ All Jadeed logs have structured data - no filtering needed");
    }
    
    db.close();
    process.exit();
  });
});
