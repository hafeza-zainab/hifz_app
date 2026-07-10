const { openDb } = require('../_db');

async function checkSimilaritiesSchema() {
    const db = await openDb();
    
    try {
        console.log("Checking similarities table schema...\n");
        
        // Get table schema
        const schema = await db.all("PRAGMA table_info(similarities)");
        
        console.log("Similarities table columns:");
        schema.forEach(col => {
            console.log(`  ${col.name}: ${col.type} (notnull: ${col.notnull}, dflt_value: ${col.dflt_value})`);
        });
        
        // Check sample data
        const sample = await db.all("SELECT * FROM similarities LIMIT 3");
        
        console.log("\nSample rows:");
        sample.forEach(row => {
            console.log(`  ID ${row.id}: ${row.source_surah}:${row.source_ayah} ↔ ${row.target_surah}:${row.target_ayah}`);
            console.log(`    tips column: ${row.tips}`);
        });
        
        // Check if there's a separate 'tip' column
        const tipColumnExists = schema.some(col => col.name === 'tip');
        console.log(`\nSeparate 'tip' column exists: ${tipColumnExists}`);
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await db.close();
    }
}

checkSimilaritiesSchema();
