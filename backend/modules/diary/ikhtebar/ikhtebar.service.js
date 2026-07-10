// modules/diary/ikhtebar/ikhtebar.service.js
// C:\quran-similarity-app\backend\modules\diary\ikhtebar\ikhtebar.service.js
const repo = require("../diary.repository");

exports.createIkhtebarLogs = async (userId, entries, date) => {
    let count = 0;
    for (const entry of entries) {
        if (!entry.range_from || entry.score === undefined) continue;
        await repo.createLog(userId, "ikhtebar", entry.range_from, "", Number(entry.score), date);
        count++;
    }
    return count;
};