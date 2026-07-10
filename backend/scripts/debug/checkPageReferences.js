const { openDb } = require('../_db');

async function checkPageReferences() {
    const db = await openDb();
    
    try {
        console.log("Checking all tables with page references...\n");
        
        // Check diary_logs
        const diaryCount = await db.get("SELECT COUNT(*) as count FROM diary_logs");
        console.log(`diary_logs: ${diaryCount.count} rows`);
        console.log(`  Columns: range_from (TEXT), range_to (TEXT) - may contain page references`);
        
        // Check similarities
        const simCount = await db.get("SELECT COUNT(*) as count FROM similarities");
        const simWithSourcePage = await db.get("SELECT COUNT(*) as count FROM similarities WHERE source_page IS NOT NULL");
        const simWithTargetPage = await db.get("SELECT COUNT(*) as count FROM similarities WHERE target_page IS NOT NULL");
        console.log(`\nsimilarities: ${simCount.count} rows`);
        console.log(`  source_page: ${simWithSourcePage.count} non-null`);
        console.log(`  target_page: ${simWithTargetPage.count} non-null`);
        
        // Check heatmap_scores
        const heatmapCount = await db.get("SELECT COUNT(*) as count FROM heatmap_scores");
        console.log(`\nheatmap_scores: ${heatmapCount.count} rows`);
        console.log(`  quran_page: INTEGER column`);
        
        // Check if takhteet_goals table exists
        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
        const hasTakhteet = tables.some(t => t.name === 'takhteet_goals');
        
        if (hasTakhteet) {
            const takhteetCount = await db.get("SELECT COUNT(*) as count FROM takhteet_goals");
            console.log(`\ntakhteet_goals: ${takhteetCount.count} rows`);
            const takhteetInfo = await db.all("PRAGMA table_info(takhteet_goals)");
            const pageCols = takhteetInfo.filter(col => col.name.includes('page'));
            console.log(`  Page columns: ${pageCols.map(c => c.name).join(', ')}`);
        } else {
            console.log(`\ntakhteet_goals: table does not exist`);
        }
        
        // Check flashcard content
        const flashcardSetsCount = await db.get("SELECT COUNT(*) as count FROM flashcard_sets");
        const flashcardCardsCount = await db.get("SELECT COUNT(*) as count FROM flashcard_cards");
        console.log(`\nflashcard_sets: ${flashcardSetsCount.count} rows`);
        console.log(`flashcard_cards: ${flashcardCardsCount.count} rows`);
        console.log(`  front/back: TEXT columns - may contain page references`);
        
        // Check scheduler tables
        const schedulerEventsCount = await db.get("SELECT COUNT(*) as count FROM scheduler_events");
        const schedulerRevisionCount = await db.get("SELECT COUNT(*) as count FROM scheduler_revision_units");
        const schedulerPageAnalysisCount = await db.get("SELECT COUNT(*) as count FROM scheduler_page_analysis");
        console.log(`\nscheduler_events: ${schedulerEventsCount.count} rows`);
        console.log(`scheduler_revision_units: ${schedulerRevisionCount.count} rows`);
        console.log(`  pages: TEXT column - may contain page references`);
        console.log(`scheduler_page_analysis: ${schedulerPageAnalysisCount.count} rows`);
        console.log(`  page: INTEGER column`);
        
        // Sample check of actual page values in similarities
        const maxSourcePage = await db.get("SELECT MAX(source_page) as max FROM similarities WHERE source_page IS NOT NULL");
        const maxTargetPage = await db.get("SELECT MAX(target_page) as max FROM similarities WHERE target_page IS NOT NULL");
        console.log(`\nsimilarities page ranges:`);
        console.log(`  source_page max: ${maxSourcePage.max}`);
        console.log(`  target_page max: ${maxTargetPage.max}`);
        
        // Sample check of heatmap_scores
        const maxHeatmapPage = await db.get("SELECT MAX(quran_page) as max FROM heatmap_scores");
        console.log(`\nheatmap_scores quran_page max: ${maxHeatmapPage.max}`);
        
        // Sample check of scheduler_page_analysis
        const maxSchedulerPage = await db.get("SELECT MAX(page) as max FROM scheduler_page_analysis");
        console.log(`\nscheduler_page_analysis page max: ${maxSchedulerPage.max}`);
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await db.close();
    }
}

checkPageReferences();
