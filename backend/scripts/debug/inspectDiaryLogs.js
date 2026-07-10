const { openDb } = require('../_db');

async function inspectDiaryLogs() {
    const db = await openDb();
    
    try {
        console.log("Inspecting diary_logs...\n");
        
        // Check table structure
        const tableInfo = await db.all("PRAGMA table_info(diary_logs)");
        console.log("diary_logs columns:");
        tableInfo.forEach(col => {
            console.log(`  ${col.name}: ${col.type}`);
        });
        console.log();
        
        // Sample non-jadeed rows
        const nonJadeedSample = await db.all(`
            SELECT id, type, range_from, range_to 
            FROM diary_logs 
            WHERE type != 'jadeed' 
            LIMIT 10
        `);
        
        console.log("Sample 10 non-jadeed rows:");
        nonJadeedSample.forEach(row => {
            console.log(`  ID ${row.id} (${row.type}): from="${row.range_from}", to="${row.range_to}"`);
        });
        console.log();
        
        // Check for jadeed rows with start_page/finish_page columns
        const hasStartPage = tableInfo.some(col => col.name === 'start_page');
        const hasFinishPage = tableInfo.some(col => col.name === 'finish_page');
        
        console.log(`Has start_page column: ${hasStartPage}`);
        console.log(`Has finish_page column: ${hasFinishPage}`);
        console.log();
        
        if (hasStartPage && hasFinishPage) {
            const jadeedWithPages = await db.get(`
                SELECT COUNT(*) as count 
                FROM diary_logs 
                WHERE type = 'jadeed' 
                AND start_page IS NOT NULL 
                AND finish_page IS NOT NULL
            `);
            console.log(`Jadeed rows with start_page/finish_page populated: ${jadeedWithPages.count}`);
            
            const totalJadeed = await db.get(`
                SELECT COUNT(*) as count 
                FROM diary_logs 
                WHERE type = 'jadeed'
            `);
            console.log(`Total jadeed rows: ${totalJadeed.count}`);
            
            if (jadeedWithPages.count > 0) {
                const jadeedSample = await db.all(`
                    SELECT id, range_from, range_to, start_page, finish_page 
                    FROM diary_logs 
                    WHERE type = 'jadeed' 
                    AND start_page IS NOT NULL 
                    AND finish_page IS NOT NULL
                    LIMIT 5
                `);
                console.log("\nSample jadeed rows with page data:");
                jadeedSample.forEach(row => {
                    console.log(`  ID ${row.id}: from="${row.range_from}", to="${row.range_to}", start_page=${row.start_page}, finish_page=${row.finish_page}`);
                });
            }
        }
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await db.close();
    }
}

inspectDiaryLogs();
