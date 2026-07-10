// C:\quran-similarity-app\backend\modules\auth\auth.routes.js
// Added: GET /me and PATCH /password (both require auth token)

const express        = require("express");
const router         = express.Router();
const authController = require("./auth.controller");
const rateLimiter    = require("../../middleware/rateLimiter");
const auth           = require("../../middleware/authMiddleware");
const { validate, rules } = require("../../middleware/validate");

const signupRules = [
    rules.required("username"),
    rules.minLength("username", 3),
    rules.maxLength("username", 30),
    rules.required("email"),
    rules.isEmail("email"),
    rules.required("password"),
    rules.minLength("password", 8),
    rules.matches(
        "password",
        /^(?=.*[A-Z])(?=.*\d).{8,}$/,
        "Password must be at least 8 characters and include 1 uppercase letter and 1 number."
    ),
];

const loginRules = [
    rules.required("username"),
    rules.minLength("username", 3),
    rules.required("password"),
];

const changePasswordRules = [
    rules.required("currentPassword"),
    rules.required("newPassword"),
    rules.minLength("newPassword", 8),
    rules.matches(
        "newPassword",
        /^(?=.*[A-Z])(?=.*\d).{8,}$/,
        "newPassword must be at least 8 characters and include 1 uppercase letter and 1 number."
    ),
];

const sensoryProfileRules = [
    rules.required("sensoryProfile"),
    rules.oneOf("sensoryProfile", ["Exploratory Learner", "Repetitive Learner", "Sensitive Structured Learner", "Balanced Learner"]),
];

// Public routes (rate-limited)
router.post("/signup", rateLimiter, validate(signupRules), authController.signup);
router.post("/login",  rateLimiter, validate(loginRules),  authController.login);

// Protected routes
router.get("/me",          auth,                                 authController.getMe);
router.patch("/password",  auth, validate(changePasswordRules),  authController.changePassword);
router.patch("/sensory-profile", auth, validate(sensoryProfileRules), authController.updateSensoryProfile);
router.patch("/walkthrough", auth, authController.markWalkthroughSeen);

module.exports = router;