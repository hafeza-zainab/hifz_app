// C:\quran-similarity-app\backend\modules\similarity\filter.service.js
const MARHALA_MAP = require("../../utils/marhalaMapper");

/**
 * Apply optional filters to a list of similarity results.
 * @param {Array}  results  - raw DB rows
 * @param {string} marhala  - optional marhala name
 * @param {Array}  juzList  - optional array of juz numbers (strings or ints)
 * @param {string|number} page - optional page number
 */
const applyFilters = (results, marhala, juzList, page) => {
    let filtered = results;

    if (marhala && MARHALA_MAP[marhala]) {
        const allowedJuz = new Set(MARHALA_MAP[marhala]);
        filtered = filtered.filter((r) => allowedJuz.has(r.juz));
    }

    if (juzList?.length > 0) {
        const juzSet = new Set(juzList.map(Number));
        filtered = filtered.filter((r) => juzSet.has(r.juz));
    }

    if (page !== undefined && page !== null && page !== "") {
        const pageNum = Number(page);
        filtered = filtered.filter((r) => r.target_page === pageNum);
    }

    return filtered;
};

module.exports = { applyFilters };