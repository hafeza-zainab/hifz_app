/**
 * utils/pageConverter.js
 *
 * Utility functions for Quran page number conversions.
 * Converts between (juz, page-within-juz) and global Quran page numbers (1-604).
 */

const db = require("../config/database");

/**
 * Convert (juz, page-within-juz) to global Quran page number.
 * Uses the ayahs table to find the actual global page number.
 *
 * @param {number} juz  1-30
 * @param {number} pageWithinJuz  Page number within the juz (1-based)
 * @returns {Promise<number|null>} Global page number (1-604) or null if not found
 */
const juzPageToGlobalPage = async (juz, pageWithinJuz) => {
    // Get the first page of this juz
    const row = await db.get(
        `SELECT MIN(page) as first_page FROM ayahs WHERE juz = ?`,
        [juz]
    );
    
    if (!row || row.first_page === null) {
        return null;
    }
    
    // Calculate global page: first_page_of_juz + (pageWithinJuz - 1)
    const globalPage = row.first_page + (pageWithinJuz - 1);
    
    // Validate the result is within Quran bounds
    if (globalPage < 1 || globalPage > 604) {
        return null;
    }
    
    return globalPage;
};

/**
 * Convert global Quran page number to (juz, page-within-juz).
 * Uses the ayahs table to find the juz and calculate page-within-juz.
 *
 * @param {number} globalPage  1-604
 * @returns {Promise<{juz: number, pageWithinJuz: number}|null>}
 */
const globalPageToJuzPage = async (globalPage) => {
    if (globalPage < 1 || globalPage > 604) {
        return null;
    }
    
    const row = await db.get(
        `SELECT juz, MIN(page) as first_page FROM ayahs WHERE page = ?`,
        [globalPage]
    );
    
    if (!row || row.juz === null) {
        return null;
    }
    
    const pageWithinJuz = globalPage - row.first_page + 1;
    
    return {
        juz: row.juz,
        pageWithinJuz: pageWithinJuz
    };
};

module.exports = {
    juzPageToGlobalPage,
    globalPageToJuzPage,
};
