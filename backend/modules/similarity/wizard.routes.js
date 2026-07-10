// backend/modules/similarity/wizard.routes.js
"use strict";

const express = require("express");
const router = express.Router();
const controller = require("./wizard.controller");
const auth = require("../../middleware/authMiddleware");

// Wizard flow endpoints for Mutashabihat
router.post("/find", controller.findMutashabihat);
router.post("/pair/save", auth, controller.savePair);

module.exports = router;
