// C:\quran-similarity-app\backend\modules\diary\tasmee\tasmee.service.js
const repo = require("../diary.repository");

exports.createTasmeeLogs = async (userId, entries, date) => {
    let count = 0;
    for (const entry of entries) {
        if (!entry.range_from || entry.score === undefined) continue;
        await repo.createLog(userId, "tasmee", entry.range_from, entry.range_to ?? "", Number(entry.score), date);
        count++;
    }
    return count;
};