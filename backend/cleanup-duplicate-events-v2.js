/**
 * Phase 0: Cleanup Duplicate Scheduler Events
 * 
 * This script deduplicates scheduler_events rows by consolidating duplicate
 * single-day rows into one row per unique event with a merged daysOfWeek array.
 * 
 * Deduplication key: title_startTime_endTime
 * 
 * Process:
 * 1. Group events by deduplication key
 * 2. For each group, keep the most recent row (by updated_at)
 * 3. Merge all daysOfWeek arrays from duplicates
 * 4. Delete all other rows in the group
 */

const db = require('./config/database');

async function cleanupDuplicateEvents(dryRun = true) {
    console.log('=== DUPLICATE EVENT CLEANUP ===');
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'EXECUTE (will delete rows)'}`);
    console.log('');

    try {
        // Step 1: Get all active events
        console.log('Step 1: Fetching all active events...');
        const allEvents = await db.all(
            'SELECT * FROM scheduler_events WHERE is_active = 1 ORDER BY user_id, title, start_time, end_time'
        );
        console.log(`Total active events found: ${allEvents.length}`);
        console.log('');

        // Step 2: Group by deduplication key
        console.log('Step 2: Grouping events by deduplication key...');
        const groups = new Map();

        allEvents.forEach(event => {
            const key = `${event.title}_${event.start_time}_${event.end_time}`;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(event);
        });

        console.log(`Unique events (by key): ${groups.size}`);
        console.log(`Duplicate groups: ${Array.from(groups.values()).filter(g => g.length > 1).length}`);
        console.log('');

        // Step 3: Analyze each group
        console.log('Step 3: Analyzing duplicate groups...');
        const operations = [];
        let totalRowsToDelete = 0;

        for (const [key, group] of groups.entries()) {
            if (group.length === 1) {
                // No duplicates, skip
                continue;
            }

            // Sort by updated_at descending (most recent first)
            group.sort((a, b) => b.updated_at - a.updated_at);

            const keepRow = group[0];
            const deleteRows = group.slice(1);

            // Merge daysOfWeek arrays
            const mergedDays = new Set();
            group.forEach(row => {
                try {
                    const days = JSON.parse(row.days_of_week);
                    if (Array.isArray(days)) {
                        days.forEach(day => mergedDays.add(day));
                    }
                } catch (e) {
                    console.error(`Error parsing days_of_week for row ${row.id}:`, e);
                }
            });

            // Sort numerically ascending
            const sortedDays = Array.from(mergedDays).sort((a, b) => a - b);

            operations.push({
                key,
                keepRow: {
                    id: keepRow.id,
                    title: keepRow.title,
                    startTime: keepRow.start_time,
                    endTime: keepRow.end_time,
                    currentDaysOfWeek: keepRow.days_of_week,
                    mergedDaysOfWeek: JSON.stringify(sortedDays),
                    userId: keepRow.user_id
                },
                deleteRows: deleteRows.map(r => ({
                    id: r.id,
                    title: r.title,
                    daysOfWeek: r.days_of_week,
                    updated_at: r.updated_at
                })),
                deleteCount: deleteRows.length
            });

            totalRowsToDelete += deleteRows.length;
        }

        console.log(`Total rows to be deleted: ${totalRowsToDelete}`);
        console.log(`Total rows to be updated (merged daysOfWeek): ${operations.length}`);
        console.log('');

        // Step 4: Show sample operations
        console.log('Step 4: Sample merge operations (first 5):');
        console.log('');
        
        const sampleSize = Math.min(5, operations.length);
        for (let i = 0; i < sampleSize; i++) {
            const op = operations[i];
            console.log(`--- Sample ${i + 1} ---`);
            console.log(`Title: ${op.keepRow.title}`);
            console.log(`Time: ${op.keepRow.startTime} - ${op.keepRow.endTime}`);
            console.log(`Current daysOfWeek (keep row): ${op.keepRow.currentDaysOfWeek}`);
            console.log(`Merged daysOfWeek: ${op.keepRow.mergedDaysOfWeek}`);
            console.log(`Rows to delete (${op.deleteCount}):`);
            op.deleteRows.forEach(r => {
                console.log(`  - ID ${r.id}: daysOfWeek=${r.daysOfWeek}, updated_at=${r.updated_at}`);
            });
            console.log('');
        }

        if (operations.length > 5) {
            console.log(`... and ${operations.length - 5} more operations`);
            console.log('');
        }

        // Summary
        console.log('=== SUMMARY ===');
        console.log(`Total rows before cleanup: ${allEvents.length}`);
        console.log(`Unique events after cleanup: ${groups.size}`);
        console.log(`Rows to be deleted: ${totalRowsToDelete}`);
        console.log(`Rows to be updated: ${operations.length}`);
        console.log(`Total rows after cleanup: ${allEvents.length - totalRowsToDelete}`);
        console.log('');

        if (dryRun) {
            console.log('=== DRY RUN COMPLETE ===');
            console.log('No changes were made to the database.');
            console.log('To execute the cleanup, run with dryRun=false');
        } else {
            console.log('=== EXECUTING CLEANUP ===');
            
            // Begin transaction
            await db.run('BEGIN TRANSACTION');

            try {
                // Update kept rows with merged daysOfWeek
                for (const op of operations) {
                    await db.run(
                        'UPDATE scheduler_events SET days_of_week = ?, updated_at = ? WHERE id = ?',
                        [op.keepRow.mergedDaysOfWeek, Math.floor(Date.now() / 1000), op.keepRow.id]
                    );
                }

                // Delete duplicate rows
                for (const op of operations) {
                    const deleteIds = op.deleteRows.map(r => r.id);
                    if (deleteIds.length > 0) {
                        const placeholders = deleteIds.map(() => '?').join(',');
                        await db.run(
                            `DELETE FROM scheduler_events WHERE id IN (${placeholders})`,
                            deleteIds
                        );
                    }
                }

                // Commit transaction
                await db.run('COMMIT');
                console.log('Cleanup completed successfully!');
            } catch (error) {
                // Rollback on error
                await db.run('ROLLBACK');
                console.error('Error during cleanup, transaction rolled back:', error);
                throw error;
            }
        }

        return {
            totalBefore: allEvents.length,
            uniqueAfter: groups.size,
            rowsDeleted: totalRowsToDelete,
            rowsUpdated: operations.length,
            totalAfter: allEvents.length - totalRowsToDelete
        };

    } catch (error) {
        console.error('Error during cleanup:', error);
        throw error;
    }
}

// Run the script
const dryRun = process.argv.includes('--dry-run') ? true : 
               (process.argv.includes('--execute') ? false : true);

cleanupDuplicateEvents(dryRun)
    .then(result => {
        console.log('');
        console.log('=== RESULT ===');
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    })
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });
