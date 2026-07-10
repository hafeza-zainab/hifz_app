// backend/modules/coach/sensoryProfileWizard.routes.js
"use strict";

const express = require("express");
const router = express.Router();
const controller = require("./sensoryProfileWizard.controller");
const auth = require("../../middleware/authMiddleware");

// Sensory Profile wizard flow endpoints (backend-only classification logic)
router.post("/sensory-profile/save", auth, controller.saveProfile);
router.delete("/sensory-profile/clear", auth, controller.clearProfile);

module.exports = router;
