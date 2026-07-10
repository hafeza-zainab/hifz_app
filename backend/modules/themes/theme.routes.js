// C:\quran-similarity-app\backend\modules\themes\theme.routes.js
const express = require("express");
const router  = express.Router();
const auth    = require("../../middleware/authMiddleware");
const ctrl    = require("./theme.controller");

router.get("/current", auth, ctrl.getCurrent);
router.get("/all",     auth, ctrl.getAll);
router.get("/preview", auth, ctrl.preview);
router.post("/select", auth, ctrl.select);

module.exports = router;