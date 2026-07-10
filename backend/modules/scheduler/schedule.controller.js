const qualityAnalysisService = require('./services/intelligence/qualityAnalysis.service');
const pageAnalysisService = require('./services/intelligence/pageAnalysis.service');
const revisionUnitGenerator = require('./services/intelligence/revisionUnitGenerator.service');
const priorityEngine = require('./services/intelligence/priorityEngine.service');
const timeEstimationEngine = require('./services/intelligence/timeEstimation.service');
const dailyWorkloadPlanner = require('./services/planning/dailyWorkloadPlanner.service');
const weeklyStrategyService = require('./services/planning/weeklyStrategy.service');
const unitScheduler = require('./services/scheduling/unitScheduler.service');
const constraintService = require('./services/scheduling/constraint.service');
const scheduleRepo = require('../../repositories/scheduler/schedule.repository');
const eventRepo = require('../../repositories/scheduler/event.repository');
const revisionUnitRepo = require('../../repositories/scheduler/revisionUnit.repository');

class ScheduleController {
    /**
     * Generate complete weekly schedule
     * Main orchestration pipeline
     */
    async generateWeeklySchedule(req, res) {
        try {
            const userId = req.user.id;
            const { events, exceptions, progressAnalysis, weeklyCycle } = req.body;

            console.log('generateWeeklySchedule called with:', { userId, events: events?.length, exceptions: exceptions?.length, progressAnalysis, weeklyCycle });

            // For now, return a simple mock schedule structure
            // TODO: Implement full schedule generation pipeline
            const mockSchedule = {};
            
            for (let day = 0; day < 7; day++) {
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                mockSchedule[day] = {
                    day: dayNames[day],
                    events: [],
                    gaps: [],
                    stats: {
                        totalScheduledMinutes: 0,
                        totalFreeMinutes: 960, // 16 hours assuming 8h sleep
                        murajaahUnits: 0,
                        juzHaliUnits: 0,
                        jadeedUnits: 0,
                        totalPagesCovered: 0
                    }
                };
            }

            res.json({
                success: true,
                schedule: mockSchedule,
                revisionUnits: [],
                pageAnalysis: [],
                violations: [],
                warnings: [],
                weeklyStrategy: {}
            });

        } catch (error) {
            console.error('Error generating schedule:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get schedule for a specific week
     */
    async getSchedule(req, res) {
        try {
            const userId = req.user.id;
            const { weekId } = req.params;

            const schedule = await scheduleRepo.getById(weekId);

            if (!schedule || schedule.userId !== userId) {
                return res.status(404).json({
                    success: false,
                    error: 'Schedule not found'
                });
            }

            res.json({
                success: true,
                schedule
            });

        } catch (error) {
            console.error('Error getting schedule:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get current week's schedule
     */
    async getCurrentSchedule(req, res) {
        try {
            const userId = req.user.id;
            const weekStart = this.getWeekStart();

            const schedule = await scheduleRepo.getByUserIdAndWeek(userId, weekStart);

            if (!schedule) {
                return res.json({
                    success: true,
                    schedule: null,
                    message: 'No schedule found for current week'
                });
            }

            res.json({
                success: true,
                schedule
            });

        } catch (error) {
            console.error('Error getting current schedule:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Manually adjust schedule
     */
    async adjustSchedule(req, res) {
        try {
            const userId = req.user.id;
            const { weekId } = req.params;
            const { schedule } = req.body;

            const existing = await scheduleRepo.getById(weekId);

            if (!existing || existing.userId !== userId) {
                return res.status(404).json({
                    success: false,
                    error: 'Schedule not found'
                });
            }

            // Validate adjusted schedule
            const violations = constraintService.validateSchedule(schedule, await eventRepo.getByUserId(userId));

            if (violations.some(v => v.severity === 'error')) {
                return res.status(400).json({
                    success: false,
                    error: 'Schedule has validation errors',
                    violations
                });
            }

            // Update schedule
            await scheduleRepo.update(weekId, {
                schedule,
                conflicts: violations,
                warnings: constraintService.generateWarnings(schedule)
            });

            res.json({
                success: true,
                schedule,
                violations
            });

        } catch (error) {
            console.error('Error adjusting schedule:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Validate schedule constraints
     */
    async validateSchedule(req, res) {
        try {
            const { schedule } = req.body;
            const events = await eventRepo.getByUserId(req.user.id);

            const violations = constraintService.validateSchedule(schedule, events);
            const warnings = constraintService.generateWarnings(schedule);

            res.json({
                success: true,
                violations,
                warnings,
                isValid: violations.filter(v => v.severity === 'error').length === 0
            });

        } catch (error) {
            console.error('Error validating schedule:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get revision units
     */
    async getRevisionUnits(req, res) {
        try {
            const userId = req.user.id;
            const { workType, isScheduled } = req.query;

            const filters = {};
            if (workType) filters.workType = workType;
            if (isScheduled !== undefined) filters.isScheduled = isScheduled === 'true';

            const units = await revisionUnitRepo.getByUserId(userId, filters);

            res.json({
                success: true,
                units
            });

        } catch (error) {
            console.error('Error getting revision units:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Generate revision units
     */
    async generateRevisionUnits(req, res) {
        try {
            const userId = req.user.id;
            const { weeklyCycle, currentSipara, userProgress } = req.body;

            const pageAnalysis = await pageAnalysisService.analyze(userId);

            const units = await revisionUnitGenerator.generateAll(
                userId,
                weeklyCycle,
                currentSipara,
                userProgress
            );

            res.json({
                success: true,
                units
            });

        } catch (error) {
            console.error('Error generating revision units:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Build final schedule structure
     */
    buildFinalSchedule(weeklySchedule, dailyWorkloads, weeklyStrategy) {
        const finalSchedule = {};

        for (let day = 0; day < 7; day++) {
            const daySchedule = weeklySchedule[day];
            const workload = dailyWorkloads[day];

            if (!daySchedule) {
                finalSchedule[day] = {
                    events: [],
                    gaps: [],
                    stats: {
                        totalScheduledMinutes: 0,
                        totalFreeMinutes: workload?.availableMinutes || 0,
                        murajaahUnits: 0,
                        juzHaliUnits: 0,
                        jadeedUnits: 0,
                        totalPagesCovered: 0
                    }
                };
                continue;
            }

            // Combine fixed events and scheduled revision units
            const events = [];

            // Add fixed events
            for (const event of daySchedule.timeline.events) {
                events.push({
                    eventId: event.id,
                    title: event.title,
                    startTime: event.startTime,
                    endTime: event.endTime,
                    duration: event.duration,
                    isFixed: true,
                    isScheduled: true
                });
            }

            // Add scheduled revision units
            for (const unit of daySchedule.scheduledUnits) {
                if (unit.scheduledSlots) {
                    for (const slot of unit.scheduledSlots) {
                        events.push({
                            revisionUnitId: unit.id,
                            title: `${unit.workType} - ${unit.pageRange}`,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            duration: this.calculateDuration(slot.startTime, slot.endTime),
                            workType: unit.workType,
                            isFixed: false,
                            isScheduled: true,
                            priority: unit.priority,
                            pages: slot.pages
                        });
                    }
                }
            }

            // Sort events by start time
            events.sort((a, b) => 
                this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
            );

            // Calculate stats
            const stats = this.calculateDayStats(events, daySchedule.scheduledUnits);

            finalSchedule[day] = {
                events,
                gaps: daySchedule.gaps,
                stats
            };
        }

        return finalSchedule;
    }

    calculateDayStats(events, scheduledUnits) {
        const stats = {
            totalScheduledMinutes: 0,
            totalFreeMinutes: 0,
            murajaahUnits: 0,
            juzHaliUnits: 0,
            jadeedUnits: 0,
            totalPagesCovered: 0
        };

        for (const event of events) {
            if (!event.isFixed) {
                stats.totalScheduledMinutes += event.duration;
                stats.totalPagesCovered += event.pages?.length || 0;

                if (event.workType === 'murajaah') stats.murajaahUnits++;
                else if (event.workType === 'juz_hali') stats.juzHaliUnits++;
                else if (event.workType === 'jadeed') stats.jadeedUnits++;
            }
        }

        return stats;
    }

    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    calculateDuration(startTime, endTime) {
        return this.timeToMinutes(endTime) - this.timeToMinutes(startTime);
    }

    getWeekStart() {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
        const monday = new Date(now.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return Math.floor(monday.getTime() / 1000);
    }
}

module.exports = new ScheduleController();
