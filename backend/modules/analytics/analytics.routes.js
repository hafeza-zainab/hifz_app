//C:\quran-similarity-app\backend\modules\analytics\analytics.routes.js
const express    = require("express");
const router     = express.Router();
const controller = require("./analytics.controller");
const auth       = require("../../middleware/authMiddleware");

router.get("/trend",     auth, controller.getTrend);
router.get("/deep-dive", auth, controller.getDeepDive);
router.get("/heatmap",   auth, controller.getHeatmapData);
router.post("/heatmap",  auth, controller.saveHeatmapData); // NEW

module.exports = router;