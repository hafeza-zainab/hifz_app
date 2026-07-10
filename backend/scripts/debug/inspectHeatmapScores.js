const { openDb } = require('../_db');

async function inspectHeatmapScores() {
    const db = await openDb();
    
    try {
        console.log("Inspecting heatmap_scores table structure and data...\n");
        
        // Check table structure
        const tableInfo = await db.all("PRAGMA table_info(heatmap_scores)");
        console.log("heatmap_scores columns:");
        tableInfo.forEach(col => {
            console.log(`  ${col.name}: ${col.type}`);
        });
        console.log();
        
        // Sample rows to understand the relationship
        const sampleRows = await db.all(`
            SELECT id, user_id, sipara, page_number, quran_page, score 
            FROM heatmap_scores 
            LIMIT 10
        `);
        
        console.log("Sample 10 rows:");
        sampleRows.forEach(row => {
            console.log(`  ID ${row.id}: user=${row.user_id}, sipara=${row.sipara}, page_number=${row.page_number}, quran_page=${row.quran_page}, score=${row.score}`);
        });
        console.log();
        
        // Check the relationship between sipara, page_number, and quran_page
        const uniqueSiparas = await db.all("SELECT DISTINCT sipara FROM heatmap_scores ORDER BY sipara");
        console.log(`Unique siparas in heatmap_scores: ${uniqueSiparas.length}`);
        console.log(`Siparas: ${uniqueSiparas.map(s => s.sipara).join(', ')}`);
        console.log();
        
        // Check if there's a pattern in page_number vs quran_page
        const pageAnalysis = await db.all(`
            SELECT sipara, page_number, quran_page
            FROM heatmap_scores
            ORDER BY sipara, page_number
            LIMIT 20
        `);
        
        console.log("Relationship analysis (first 20 rows):");
        pageAnalysis.forEach(row => {
            console.log(`  Sipara ${row.sipara}, page_number ${row.page_number} → quran_page ${row.quran_page}`);
        });
        console.log();
        
        // Check if page_number is sequential within each sipara
        const sipara1Pages = await db.all(`
            SELECT page_number, quran_page
            FROM heatmap_scores
            WHERE sipara = 1
            ORDER BY page_number
        `);
        
        console.log("Sipara 1 page_number vs quran_page:");
        sipara1Pages.forEach(row => {
            console.log(`  page_number ${row.page_number} → quran_page ${row.quran_page}`);
        });
        console.log();
        
        // Check the ayahs table to understand the mapping
        const ayahSample = await db.all(`
            SELECT surah, ayah, page, juz
            FROM ayahs
            WHERE page IN (1, 2, 522, 604)
            ORDER BY page
            LIMIT 10
        `);
        
        console.log("Sample ayahs table data for key pages:");
        ayahSample.forEach(row => {
            console.log(`  Surah ${row.surah}, Ayah ${row.ayah}, Page ${row.page}, Juz ${row.juz}`);
        });
        console.log();
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await db.close();
    }
}

inspectHeatmapScores();
