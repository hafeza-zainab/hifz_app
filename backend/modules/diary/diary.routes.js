// modules/diary/diary.routes.js
"use strict";

const express    = require("express");
const router     = express.Router();
const auth       = require("../../middleware/authMiddleware");
const diaryRepo  = require("../../repositories/diary.repository");
const { validate, rules } = require("../../middleware/validate");
const { formatSuccess }   = require("../../utils/responseFormatter");

// ─── Shared validation rules ──────────────────────────────────────────────────
const batchEntryRules = [rules.isArray("entries")];

const jadeedRules = [
    rules.required("range_from_surah"),
    rules.required("range_from_ayah"),
    rules.isInt("score", { min: 0, max: 10 }),
];

// ─── Diary write routes ───────────────────────────────────────────────────────
router.post("/murajah",  auth, validate(batchEntryRules), require("./murajah/murajah.controller").addMurajahLog);
router.post("/tasmee",   auth, validate(batchEntryRules), require("./tasmee/tasmee.controller").addTasmeeLog);
router.post("/ikhtebar", auth, validate(batchEntryRules), require("./ikhtebar/ikhtebar.controller").addIkhtebarLog);
router.post("/jadeed",   auth, validate(jadeedRules),     require("./jadeed/jadeed.controller").addJadeedLog);
router.post("/juz-hali", auth, validate(batchEntryRules), require("./juzzHali/juzzHali.controller").addJuzHaliLog);

// ─── Log read / update / delete routes ───────────────────────────────────────
router.get("/logs",       auth, require("./log/log.controller").getLogs);
router.put("/log/:id",    auth, validate([rules.isInt("score", { min: 0, max: 10 })]), require("./log/log.controller").updateLog);
router.delete("/log/:id", auth, require("./log/log.controller").deleteLog);

// ─── GET /api/diary/heatmap ───────────────────────────────────────────────────
// Per-page average scores for the heatmap widget.
// Shape: [{ page, juz, score }]
router.get("/heatmap", auth, async (req, res, next) => {
    try {
        const rows = await diaryRepo.getHeatmapAggregates(req.user.id);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
});

// ─── GET /api/diary/recent?limit=30 ──────────────────────────────────────────
// Most-recent N diary entries for the logged-in user (max 100).
// Shape: [{ id, type, range_from, range_to, score, created_at, … }]
router.get("/recent", auth, async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 30;
        const rows  = await diaryRepo.getRecentLogs(req.user.id, limit);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
});

// ─── Takhteet (Jadeed planning/progress) routes ───────────────────────────────
const takhteetController = require("./takhteet/takhteet.controller");

router.get("/takhteet", auth, takhteetController.getGoal);
router.post("/takhteet", auth, takhteetController.createGoal);
router.patch("/takhteet/:id", auth, takhteetController.updateGoal);
router.get("/takhteet/progress", auth, takhteetController.getProgress);

module.exports = router;