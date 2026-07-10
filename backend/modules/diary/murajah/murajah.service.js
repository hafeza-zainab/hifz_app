// modules/diary/murajah/murajah.service.js
const repo = require("../diary.repository");

exports.createMurajahLogs = async (userId, entries, date) => {
    let count = 0;
    for (const entry of entries) {
        if (!entry.range_from || entry.score === undefined) continue;
        await repo.createLog(userId, "murajah", entry.range_from, entry.range_to ?? "", Number(entry.score), date);
        count++;
    }
    return count;
};