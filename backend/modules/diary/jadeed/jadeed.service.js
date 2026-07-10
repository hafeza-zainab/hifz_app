// C:\quran-similarity-app\backend\modules\diary\jadeed\jadeed.service.js
const repo        = require("../diary.repository");
const SURAH_NAMES = require("../../../utils/surahNames");

exports.createJadeedLog = async (userId, payload) => {
    const date = payload.date || new Date().toISOString().split("T")[0];

    if (!payload.range_from_surah || !payload.range_from_ayah) {
        throw Object.assign(new Error("range_from_surah and range_from_ayah are required."), { statusCode: 400 });
    }

    const fromName = payload.range_from_name || SURAH_NAMES[parseInt(payload.range_from_surah)] || `Surah ${payload.range_from_surah}`;
    const toName = payload.range_to_name || (payload.range_to_surah ? SURAH_NAMES[parseInt(payload.range_to_surah)] || `Surah ${payload.range_to_surah}` : "");

    const rangeFrom = `${fromName} (${payload.range_from_surah}) : ${payload.range_from_ayah}`;
    const rangeTo = payload.range_to_surah && payload.range_to_ayah
        ? `${toName} (${payload.range_to_surah}) : ${payload.range_to_ayah}`
        : "";

    await repo.createLog(
        userId, 
        "jadeed", 
        rangeFrom, 
        rangeTo, 
        Number(payload.score), 
        date,
        payload.start_page,
        payload.finish_page,
        payload.start_juz,
        payload.finish_juz
    );
};