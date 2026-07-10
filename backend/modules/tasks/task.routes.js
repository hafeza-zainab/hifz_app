//C:\quran-similarity-app\backend\modules\tasks\task.routes.js
const express    = require("express");
const router     = express.Router();
const controller = require("./task.controller");
const auth       = require("../../middleware/authMiddleware");
const { validate, rules } = require("../../middleware/validate");

const VALID_STATUSES   = ["pending", "in_progress", "completed"];
const VALID_CATEGORIES = ["murajah", "jadeed", "Juz_Hali", "tasmee", "general"];

const createRules = [
    rules.required("title"),
    rules.maxLength("title", 200),
    rules.oneOf("category", VALID_CATEGORIES),
];

const updateStatusRules = [rules.oneOf("status", VALID_STATUSES)];
const updateTitleRules  = [rules.required("title"), rules.maxLength("title", 200)];

router.get("/streak", auth, controller.getStreak);
router.post("/",      auth, validate(createRules),      controller.createTask);
router.get("/",       auth,                             controller.getTasks);
router.patch("/:id",  auth, validate(updateStatusRules), controller.updateTask);
router.put("/:id",    auth, validate(updateTitleRules),  controller.editTaskTitle);
router.delete("/:id", auth,                             controller.deleteTask);

module.exports = router;
