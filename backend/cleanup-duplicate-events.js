/**
 * ONE-TIME DATA CLEANUP SCRIPT
 * 
 * Purpose: Collapse duplicate event rows created by the template application bug
 * 
 * Bug: Template apply() was creating ONE ROW PER DAY PER EVENT instead of
 * ONE ROW PER EVENT with daysOfWeek: [all selected days]
 * 
 * This script:
 * 1. Groups events by (userId, title, startTime, endTime)
 * 2. Merges daysOfWeek arrays across each group
 * 3. Deletes duplicate rows, keeping one with merged daysOfWeek
 * 4. Logs before/after counts and sample merged events
 * 
 * USAGE: node cleanup-duplicate-events.js
 * 
 * WARNING: This modifies the database. Backup before running!
 */

const db = require('./config/database');
const eventRepo = require('./repositories/scheduler/event.repository');

async function cleanupDuplicateEvents() {
    console.log('=== EVENT CLEANUP SCRIPT ===');
    console.log('Starting cleanup of duplicate event rows...\n');
    
    try {
        // Step 1: Get all active events
        console.log('Step 1: Fetching all active events...');
        const allEvents = await db.all(
            'SELECT * FROM scheduler_events WHERE is_active = 1 ORDER BY user_id, title, start_time'
        );
        console.log(`Found ${allEvents.length} total active events\n`);
        
        // Step 2: Group events by (userId, title, startTime, endTime)
        console.log('Step 2: Grouping events by (userId, title, startTime, endTime)...');
        const groups = new Map();
        
        allEvents.forEach(event => {
            const key = `${event.user_id}|${event.title}|${event.start_time}|${event.end_time}`;
            
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            
            groups.get(key).push(event);
        });
        
        console.log(`Found ${groups.size} unique event definitions\n`);
        
        // Step 3: Identify groups with duplicates
        console.log('Step 3: Identifying groups with duplicates...');
        const duplicateGroups = [];
        
        for (const [key, events] of groups.entries()) {
            if (events.length > 1) {
                duplicateGroups.push({ key, events });
            }
        }
        
        console.log(`Found ${duplicateGroups.length} groups with duplicates\n`);
        
        if (duplicateGroups.length === 0) {
            console.log('No duplicates found. Nothing to clean up.');
            return;
        }
        
        // Step 4: Show sample of what will be merged
        console.log('Step 4: Sample of events to be merged (first 5 groups):');
        console.log('=========================================================\n');
        
        const sampleCount = Math.min(5, duplicateGroups.length);
        for (let i = 0; i < sampleCount; i++) {
            const { key, events } = duplicateGroups[i];
            console.log(`Group ${i + 1}: ${key}`);
            console.log(`  Current rows: ${events.length}`);
            
            // Merge daysOfWeek
            const mergedDays = new Set();
            events.forEach(e => {
                const days = JSON.parse(e.days_of_week);
                days.forEach(d => mergedDays.add(d));
            });
            const sortedDays = Array.from(mergedDays).sort((a, b) => a - b);
            
            console.log(`  Merged daysOfWeek: [${sortedDays.join(', ')}]`);
            console.log(`  Will delete ${events.length - 1} rows, keep 1 row with merged days\n`);
        }
        
        console.log('=========================================================\n');
        
        // Step 5: Perform cleanup
        console.log('Step 5: Performing cleanup...');
        console.log('WARNING: This will modify the database!');
        console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        let deletedCount = 0;
        let updatedCount = 0;
        const mergeDetails = [];
        
        for (const { key, events } of duplicateGroups) {
            // Merge daysOfWeek
            const mergedDays = new Set();
            events.forEach(e => {
                const days = JSON.parse(e.days_of_week);
                days.forEach(d => mergedDays.add(d));
            });
            const sortedDays = Array.from(mergedDays).sort((a, b) => a - b);
            
            // Keep the first row, update its daysOfWeek
            const keepEvent = events[0];
            const deleteEvents = events.slice(1);
            
            // Update the kept row
            await db.run(
                'UPDATE scheduler_events SET days_of_week = ?, updated_at = ? WHERE id = ?',
                [JSON.stringify(sortedDays), Math.floor(Date.now() / 1000), keepEvent.id]
            );
            updatedCount++;
            
            // Delete the duplicate rows
            for (const deleteEvent of deleteEvents) {
                await db.run('UPDATE scheduler_events SET is_active = 0 WHERE id = ?', [deleteEvent.id]);
                deletedCount++;
            }
            
            mergeDetails.push({
                key,
                originalCount: events.length,
                mergedDays: sortedDays
            });
        }
        
        // Step 6: Verify cleanup
        console.log('\nStep 6: Verifying cleanup...');
        const remainingEvents = await db.all(
            'SELECT * FROM scheduler_events WHERE is_active = 1 ORDER BY user_id, title, start_time'
        );
        
        console.log('\n=== CLEANUP COMPLETE ===');
        console.log(`Before: ${allEvents.length} events`);
        console.log(`After:  ${remainingEvents.length} events`);
        console.log(`Deleted: ${deletedCount} duplicate rows`);
        console.log(`Updated: ${updatedCount} rows with merged daysOfWeek`);
        console.log(`Net reduction: ${allEvents.length - remainingEvents.length} rows\n`);
        
        console.log('Sample merged events (first 3):');
        console.log('========================================\n');
        
        for (let i = 0; i < Math.min(3, mergeDetails.length); i++) {
            const detail = mergeDetails[i];
            console.log(`${detail.key}`);
            console.log(`  Original: ${detail.originalCount} rows`);
            console.log(`  Merged daysOfWeek: [${detail.mergedDays.join(', ')}]\n`);
        }
        
        console.log('========================================\n');
        console.log('Cleanup completed successfully!');
        
    } catch (error) {
        console.error('\nERROR during cleanup:', error);
        console.error('Cleanup was interrupted. Database may be in partial state.');
        process.exit(1);
    }
}

// Run the cleanup
cleanupDuplicateEvents()
    .then(() => {
        console.log('\nScript completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nScript failed:', error);
        process.exit(1);
    });
