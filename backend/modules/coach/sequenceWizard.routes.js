// backend/modules/coach/sequenceWizard.routes.js
"use strict";

const express = require("express");
const router = express.Router();
const controller = require("./sequenceWizard.controller");
const auth = require("../../middleware/authMiddleware");

// Sequence wizard flow endpoints (backend-only traversal logic)
router.post("/sequence/surah", auth, controller.getSurahSequence);
router.post("/sequence/page", auth, controller.getPageSequence);
router.post("/sequence/juz-pages", auth, controller.getJuzPagesSequence);
router.post("/sequence/juz-surahs", auth, controller.getJuzSurahSequence);

module.exports = router;
