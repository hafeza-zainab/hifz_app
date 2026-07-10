const templateRepo = require('../../repositories/scheduler/scheduleTemplates.repository');
const eventRepo = require('../../repositories/scheduler/event.repository');
const { BUILT_IN_TEMPLATES, SCHOOL_BOARD_TIMINGS, GRADE_BANDS } = require('./builtInTemplates');

class TemplateController {
    async getAll(req, res) {
        try {
            const userId = req.user.id;
            
            // Get user's custom templates
            const customTemplates = await templateRepo.getTemplatesForUser(userId);
            
            // Parse events from JSON
            const parsedCustom = customTemplates.map(t => ({
                ...t,
                events: JSON.parse(t.events)
            }));

            res.json({
                success: true,
                builtIn: BUILT_IN_TEMPLATES,
                custom: parsedCustom
            });

        } catch (error) {
            console.error('Error getting templates:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getSchoolBoards(req, res) {
        try {
            res.json({
                success: true,
                boards: Object.keys(SCHOOL_BOARD_TIMINGS),
                gradeBands: GRADE_BANDS
            });
        } catch (error) {
            console.error('Error getting school boards:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const userId = req.user.id;
            const { name, events } = req.body;

            if (!name || !events) {
                return res.status(400).json({
                    success: false,
                    error: 'Name and events are required'
                });
            }

            const result = await templateRepo.createTemplate(userId, name, events);

            res.json({
                success: true,
                id: result.id
            });

        } catch (error) {
            console.error('Error creating template:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Verify ownership
            const template = await templateRepo.getTemplateById(id);
            if (!template || template.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            }

            await templateRepo.deleteTemplate(id, userId);

            res.json({
                success: true,
                message: 'Template deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting template:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async apply(req, res) {
        try {
            const userId = req.user.id;
            const { events, days, board, gradeBand } = req.body;

            if (!events || !days || !Array.isArray(days) || days.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Events and days array are required'
                });
            }

            // If board and gradeBand are provided, inject the School block
            let finalEvents = events;
            if (board && gradeBand && SCHOOL_BOARD_TIMINGS[board]) {
                const gradeIndex = GRADE_BANDS.indexOf(gradeBand);
                if (gradeIndex >= 0) {
                    const timing = SCHOOL_BOARD_TIMINGS[board][gradeIndex];
                    const schoolBlock = {
                        name: 'School',
                        startTime: timing[0],
                        endTime: timing[1]
                    };
                    // Add School block if not already present
                    if (!events.some(e => e.name === 'School')) {
                        finalEvents = [...events, schoolBlock];
                    }
                }
            }

            const createdEvents = [];

            // FIXED: Loop per-event, not per-day
            // Create ONE row per event with daysOfWeek: [all selected days]
            for (const event of finalEvents) {
                // Check if event already exists (UPSERT logic)
                const existingEvents = await eventRepo.getByUserId(userId);
                const existingEvent = existingEvents.find(e => 
                    e.title === event.name && 
                    e.startTime === event.startTime && 
                    e.endTime === event.endTime
                );

                const eventData = {
                    userId,
                    title: event.name,
                    category: 'routine',
                    startTime: event.startTime,
                    endTime: event.endTime,
                    daysOfWeek: days,  // FIXED: All selected days, not single day
                    recurrence: 'weekly',
                    isFixed: 1,
                    priority: 'medium'
                };

                // Calculate duration (handles overnight events)
                const start = this.timeToMinutes(event.startTime);
                const end = this.timeToMinutes(event.endTime);
                let duration = end - start;
                if (end < start) {
                    duration = (24 * 60) - start + end;
                }
                eventData.duration = duration;

                let savedEvent;

                if (existingEvent) {
                    // UPDATE existing event with new daysOfWeek
                    await eventRepo.update(existingEvent.id, eventData);
                    savedEvent = await eventRepo.getById(existingEvent.id);
                    console.log(`Updated existing event: ${event.name} with daysOfWeek:`, days);
                } else {
                    // INSERT new event
                    const id = await eventRepo.create(eventData);
                    savedEvent = await eventRepo.getById(id);
                    console.log(`Created new event: ${event.name} with daysOfWeek:`, days);
                }

                createdEvents.push(savedEvent);
            }

            res.json({
                success: true,
                events: createdEvents,
                message: `Applied ${finalEvents.length} events to ${days.length} day(s)`
            });

        } catch (error) {
            console.error('Error applying template:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
}

module.exports = new TemplateController();
