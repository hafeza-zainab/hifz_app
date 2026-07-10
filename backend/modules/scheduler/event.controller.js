const eventRepo = require('../../repositories/scheduler/event.repository');

class EventController {
    async create(req, res) {
        try {
            const userId = req.user.id;
            const event = req.body;

            console.log('EventController.create: userId =', userId);
            console.log('EventController.create: request body =', JSON.stringify(event, null, 2));

            const eventData = {
                ...event,
                userId,
                duration: this.calculateDuration(event.startTime, event.endTime)
            };

            console.log('EventController.create: eventData to insert =', JSON.stringify(eventData, null, 2));

            const id = await eventRepo.create(eventData);
            console.log('EventController.create: DB insert returned id =', id);

            const savedEvent = await eventRepo.getById(id);
            console.log('EventController.create: Saved event from DB =', JSON.stringify(savedEvent, null, 2));

            if (!savedEvent) {
                console.error('EventController.create: Failed to retrieve saved event with id =', id);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to retrieve saved event'
                });
            }

            res.json({
                success: true,
                id,
                event: savedEvent
            });

        } catch (error) {
            console.error('Error creating event:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const event = await eventRepo.getById(id);

            if (!event) {
                return res.status(404).json({
                    success: false,
                    error: 'Event not found'
                });
            }

            res.json({
                success: true,
                event
            });

        } catch (error) {
            console.error('Error getting event:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getByUserId(req, res) {
        try {
            const userId = req.user.id;
            console.log('EventController.getByUserId: userId =', userId);
            
            const events = await eventRepo.getByUserId(userId);
            console.log(`EventController.getByUserId: Found ${events?.length || 0} events for user:`, events);

            res.json({
                success: true,
                events
            });

        } catch (error) {
            console.error('Error getting events:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const eventData = req.body;

            const existing = await eventRepo.getById(id);

            if (!existing || existing.userId !== userId) {
                return res.status(404).json({
                    success: false,
                    error: 'Event not found'
                });
            }

            const updatedData = {
                ...eventData,
                duration: this.calculateDuration(eventData.startTime, eventData.endTime)
            };

            const updated = await eventRepo.update(id, updatedData);

            res.json({
                success: true,
                event: updated
            });

        } catch (error) {
            console.error('Error updating event:', error);
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

            const existing = await eventRepo.getById(id);

            if (!existing || existing.userId !== userId) {
                return res.status(404).json({
                    success: false,
                    error: 'Event not found'
                });
            }

            await eventRepo.delete(id);

            res.json({
                success: true,
                message: 'Event deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting event:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async copy(req, res) {
        try {
            const userId = req.user.id;
            const { eventId, targetDays } = req.body;

            const sourceEvent = await eventRepo.getById(eventId);

            if (!sourceEvent || sourceEvent.userId !== userId) {
                return res.status(404).json({
                    success: false,
                    error: 'Event not found'
                });
            }

            const createdEvents = [];

            for (const day of targetDays) {
                const newEvent = {
                    ...sourceEvent,
                    id: undefined,
                    daysOfWeek: [day]
                };
                const id = await eventRepo.create(newEvent);
                createdEvents.push(await eventRepo.getById(id));
            }

            res.json({
                success: true,
                events: createdEvents
            });

        } catch (error) {
            console.error('Error copying event:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async bulkCreate(req, res) {
        try {
            const userId = req.user.id;
            const { events } = req.body;

            const createdEvents = [];

            for (const event of events) {
                const eventData = {
                    ...event,
                    userId,
                    duration: this.calculateDuration(event.startTime, event.endTime)
                };
                const id = await eventRepo.create(eventData);
                createdEvents.push(await eventRepo.getById(id));
            }

            res.json({
                success: true,
                events: createdEvents
            });

        } catch (error) {
            console.error('Error bulk creating events:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    calculateDuration(startTime, endTime) {
        const start = this.timeToMinutes(startTime);
        const end = this.timeToMinutes(endTime);
        
        // Handle overnight events (e.g., 22:00 - 06:00)
        if (end < start) {
            return (24 * 60) - start + end; // Add 24 hours worth of minutes
        }
        
        return end - start;
    }

    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
}

module.exports = new EventController();
