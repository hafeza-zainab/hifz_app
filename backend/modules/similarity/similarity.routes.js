//C:\quran-similarity-app\backend\modules\similarity\similarity.routes.js
"use strict";

const express = require("express");
const router = express.Router();
const controller = require("./similarity.controller");
const auth = require("../../middleware/authMiddleware");

router.get("/", controller.getSimilarities);

router.get("/by-pair/tips", auth, controller.getTipsByPair);
router.patch("/by-pair/tips", auth, controller.updateTipsByPair);
router.patch("/:id/tips", auth, controller.updateTips);

module.exports = router;
