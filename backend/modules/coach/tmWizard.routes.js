// backend/modules/coach/tmWizard.routes.js
"use strict";

const express = require("express");
const router = express.Router();
const controller = require("./tmWizard.controller");
const auth = require("../../middleware/authMiddleware");

// Time Management wizard flow endpoints
router.post("/tm/analyze", auth, controller.analyzeProgress);
router.post("/tm/cycle", auth, controller.generateWeeklyCycle);
router.post("/tm/generate", auth, controller.generateSchedule);
router.post("/tm/save", auth, controller.saveSchedule);

module.exports = router;
