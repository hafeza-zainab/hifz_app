/**
 * Event Deduplication Utility
 * 
 * Deduplicates events by title + startTime + endTime key.
 * This ensures that duplicate event rows (e.g., from the template application bug)
 * are collapsed into a single logical event for display purposes.
 */

export function deduplicateEvents(events) {
  const seen = new Set();
  return events.filter(event => {
    const key = `${event.title}_${event.startTime}_${event.endTime}`;
    if (seen.has(key)) {
      console.log(`Skipping duplicate event: ${event.title}`);
      return false;
    }
    seen.add(key);
    return true;
  });
}
