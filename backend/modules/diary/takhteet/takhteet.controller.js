/**
 * modules/diary/takhteet/takhteet.controller.js
 *
 * Controller for Takhteet (Jadeed planning/progress) feature.
 * Handles monthly goal CRUD and progress calculation.
 */

const repo = require("../../../repositories/takhteetGoal.repository");
const { juzPageToGlobalPage } = require("../../../utils/pageConverter");
const { formatSuccess, formatError } = require("../../../utils/responseFormatter");

/**
 * GET /api/diary/takhteet?year=YYYY&month=MM
 * Returns the goal for that month, or null if none set.
 */
exports.getGoal = async (req, res, next) => {
    try {
        const { year, month } = req.query;
        
        if (!year || !month) {
            return res.status(400).json(formatError("year and month query parameters are required"));
        }
        
        const goal = await repo.getGoalForMonth(req.user.id, parseInt(year), parseInt(month));
        
        if (!goal) {
            return res.status(404).json(formatError("No goal found for this month"));
        }
        
        res.json(formatSuccess(goal));
    } catch (err) { next(err); }
};

/**
 * POST /api/diary/takhteet
 * Creates a new goal. Rejects if one already exists for that user+year+month.
 */
exports.createGoal = async (req, res, next) => {
    try {
        const {
            year, month,
            startJuz, startPage,
            targetJuz, targetPage,
            week1Juz, week1Page,
            week2Juz, week2Page,
            week3Juz, week3Page,
            week4Juz, week4Page
        } = req.body;
        
        // Validation
        if (!year || !month || !startJuz || !startPage || !targetJuz || !targetPage) {
            return res.status(400).json(formatError("year, month, startJuz, startPage, targetJuz, and targetPage are required"));
        }
        
        // Check if goal already exists
        const existing = await repo.getGoalForMonth(req.user.id, parseInt(year), parseInt(month));
        if (existing) {
            return res.status(409).json(formatError("Goal already exists for this month. Use PATCH to update."));
        }
        
        // UTC-based date check for on-time window (days 1-5)
        const now = new Date();
        const currentDayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const firstOfMonthUTC = Date.UTC(parseInt(year), parseInt(month) - 1, 1);
        const fifthOfMonthUTC = Date.UTC(parseInt(year), parseInt(month) - 1, 5);
        
        const isLate = currentDayUTC > fifthOfMonthUTC;
        const trackingStartDate = isLate 
            ? `${year}-${String(parseInt(month)).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
            : `${year}-${String(parseInt(month)).padStart(2, '0')}-01`;
        
        const result = await repo.createGoal(
            req.user.id, parseInt(year), parseInt(month),
            parseInt(startJuz), parseInt(startPage),
            parseInt(targetJuz), parseInt(targetPage),
            week1Juz ? parseInt(week1Juz) : null,
            week1Page ? parseInt(week1Page) : null,
            week2Juz ? parseInt(week2Juz) : null,
            week2Page ? parseInt(week2Page) : null,
            week3Juz ? parseInt(week3Juz) : null,
            week3Page ? parseInt(week3Page) : null,
            week4Juz ? parseInt(week4Juz) : null,
            week4Page ? parseInt(week4Page) : null,
            isLate, trackingStartDate
        );
        
        res.status(201).json(formatSuccess({ id: result.id }, "Goal created successfully"));
    } catch (err) { next(err); }
};

/**
 * PATCH /api/diary/takhteet/:id
 * Updates an existing goal. Only allows edits if the calling user owns the goal.
 */
exports.updateGoal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            startJuz, startPage,
            targetJuz, targetPage,
            week1Juz, week1Page,
            week2Juz, week2Page,
            week3Juz, week3Page,
            week4Juz, week4Page
        } = req.body;
        
        // Validation
        if (!startJuz || !startPage || !targetJuz || !targetPage) {
            return res.status(400).json(formatError("startJuz, startPage, targetJuz, and targetPage are required"));
        }
        
        // Get the goal to verify ownership
        const goal = await repo.getGoalById(parseInt(id));
        if (!goal) {
            return res.status(404).json(formatError("Goal not found"));
        }
        if (goal.user_id !== req.user.id) {
            return res.status(403).json(formatError("You don't own this goal"));
        }
        
        const result = await repo.updateGoal(
            parseInt(id),
            parseInt(startJuz), parseInt(startPage),
            parseInt(targetJuz), parseInt(targetPage),
            week1Juz ? parseInt(week1Juz) : null,
            week1Page ? parseInt(week1Page) : null,
            week2Juz ? parseInt(week2Juz) : null,
            week2Page ? parseInt(week2Page) : null,
            week3Juz ? parseInt(week3Juz) : null,
            week3Page ? parseInt(week3Page) : null,
            week4Juz ? parseInt(week4Juz) : null,
            week4Page ? parseInt(week4Page) : null
        );
        
        res.json(formatSuccess(null, "Goal updated successfully"));
    } catch (err) { next(err); }
};

/**
 * GET /api/diary/takhteet/progress?year=YYYY&month=MM
 * Calculates progress against the monthly goal.
 */
exports.getProgress = async (req, res, next) => {
    try {
        const { year, month } = req.query;
        
        if (!year || !month) {
            return res.status(400).json(formatError("year and month query parameters are required"));
        }
        
        const goal = await repo.getGoalForMonth(req.user.id, parseInt(year), parseInt(month));
        if (!goal) {
            return res.status(404).json(formatError("No goal found for this month"));
        }
        
        // Get the most recent Jadeed log with structured data
        const latestLog = await repo.getLatestJadeedLog(req.user.id);
        
        // Determine current position
        let currentJuz, currentPage;
        if (latestLog && latestLog.finish_page) {
            currentJuz = latestLog.finish_juz;
            currentPage = latestLog.finish_page;
        } else {
            // No Jadeed logs yet - default to start position
            currentJuz = goal.start_juz;
            currentPage = goal.start_page;
        }
        
        // Convert all positions to global page numbers
        const startGlobalPage = await juzPageToGlobalPage(goal.start_juz, goal.start_page);
        const targetGlobalPage = await juzPageToGlobalPage(goal.target_juz, goal.target_page);
        const currentGlobalPage = await juzPageToGlobalPage(currentJuz, currentPage);
        
        if (!startGlobalPage || !targetGlobalPage || !currentGlobalPage) {
            return res.status(500).json(formatError("Failed to convert page numbers"));
        }
        
        // Calculate monthly progress
        const totalRange = targetGlobalPage - startGlobalPage;
        const progressRange = currentGlobalPage - startGlobalPage;
        let monthlyProgressPercent = totalRange > 0 ? (progressRange / totalRange) * 100 : 0;
        monthlyProgressPercent = Math.max(0, Math.min(100, monthlyProgressPercent));
        
        // Calculate remaining pages
        const remainingPages = Math.max(0, targetGlobalPage - currentGlobalPage);
        
        // Determine tracking start date (with backward compatibility)
        const trackingStartDate = goal.tracking_start_date 
            ? new Date(goal.tracking_start_date) 
            : new Date(Date.UTC(goal.year, goal.month - 1, 1)); // Default to 1st of month for existing goals (UTC)
        
        // Determine current week number (based on days elapsed since tracking start)
        const now = new Date();
        const daysElapsed = Math.floor((now - trackingStartDate) / (1000 * 60 * 60 * 24));
        const currentWeekNumber = Math.min(4, Math.floor(daysElapsed / 7) + 1);
        
        // Calculate week progress against its milestone
        let weekProgressPercent = 0;
        let weekStartGlobalPage = startGlobalPage;
        let weekTargetGlobalPage = targetGlobalPage;
        
        // Get the milestone for the current week
        const weekMilestoneJuz = goal[`week${currentWeekNumber}_juz`];
        const weekMilestonePage = goal[`week${currentWeekNumber}_page`];
        
        if (weekMilestoneJuz && weekMilestonePage) {
            weekTargetGlobalPage = await juzPageToGlobalPage(weekMilestoneJuz, weekMilestonePage);
            if (weekTargetGlobalPage) {
                const weekTotalRange = weekTargetGlobalPage - weekStartGlobalPage;
                const weekProgressRange = currentGlobalPage - weekStartGlobalPage;
                weekProgressPercent = weekTotalRange > 0 ? (weekProgressRange / weekTotalRange) * 100 : 0;
                weekProgressPercent = Math.max(0, Math.min(100, weekProgressPercent));
            }
        }
        
        res.json(formatSuccess({
            currentJuz,
            currentPage,
            targetJuz: goal.target_juz,
            targetPage: goal.target_page,
            monthlyProgressPercent: Math.round(monthlyProgressPercent),
            currentWeekNumber,
            weekProgressPercent: Math.round(weekProgressPercent),
            remainingPages
        }));
    } catch (err) { next(err); }
};
