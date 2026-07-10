const { openDb } = require('../_db');

async function inspectFlashcardCards() {
    const db = await openDb();
    
    try {
        console.log("Inspecting flashcard_cards...\n");
        
        // Get all 34 rows
        const allCards = await db.all(`
            SELECT id, set_id, front, back 
            FROM flashcard_cards
        `);
        
        console.log(`Total flashcard_cards: ${allCards.length}\n`);
        
        console.log("All 34 rows (checking for page references):");
        allCards.forEach(row => {
            const hasPageRef = row.front.toLowerCase().includes('page') || row.back.toLowerCase().includes('page');
            const marker = hasPageRef ? ' ⚠️ PAGE REF' : '';
            console.log(`  ID ${row.id} (set ${row.set_id}):`);
            console.log(`    Front: ${row.front.substring(0, 60)}...`);
            console.log(`    Back: ${row.back.substring(0, 60)}...${marker}`);
            console.log();
        });
        
        // Count cards with page references
        const withPageRef = allCards.filter(row => 
            row.front.toLowerCase().includes('page') || row.back.toLowerCase().includes('page')
        );
        console.log(`Cards with page references: ${withPageRef.length}`);
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await db.close();
    }
}

inspectFlashcardCards();
