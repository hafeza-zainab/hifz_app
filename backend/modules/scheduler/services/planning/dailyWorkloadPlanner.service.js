const eventRepo = require('../../../../repositories/scheduler/event.repository');
const revisionUnitRepo = require('../../../../repositories/scheduler/revisionUnit.repository');

class DailyWorkloadPlanner {
    /**
     * Determine what should be scheduled today
     * Ranks revision units and schedules based on available time
     */
    async planDailyWorkload(userId, dayOfWeek, weeklyStrategy, userGoals) {
        // Load events for this day
        const events = await eventRepo.getByUserId(userId);
        const dayEvents = events.filter(e => e.daysOfWeek.includes(dayOfWeek));

        // Calculate total available time
        const availableMinutes = this.calculateAvailableTime(dayEvents);

        // Apply weekly strategy weighting
        const workloadPercentage = weeklyStrategy[dayOfWeek] || 1.0;
        const targetWorkload = Math.round(availableMinutes * (workloadPercentage / 100));

        // Load all unscheduled revision units
        const revisionUnits = await revisionUnitRepo.getByUserId(userId, { isScheduled: false });

        // Calculate total revision time needed
        const totalRevisionTime = revisionUnits.reduce((sum, unit) => sum + unit.estimatedTime, 0);

        // If total needed > available, rank and prioritize
        if (totalRevisionTime > targetWorkload) {
            const rankedUnits = [...revisionUnits].sort((a, b) => b.priority - a.priority);
            const scheduledUnits = [];
            let currentTime = 0;

            for (const unit of rankedUnits) {
                if (currentTime + unit.estimatedTime <= targetWorkload) {
                    scheduledUnits.push(unit);
                    currentTime += unit.estimatedTime;
                }
            }

            const unscheduledUnits = rankedUnits.slice(scheduledUnits.length);

            return {
                scheduledUnits,
                unscheduledUnits,
                targetWorkload,
                actualWorkload: currentTime,
                utilization: Math.round((currentTime / targetWorkload) * 100),
                availableMinutes,
                dayEvents
            };
        } else {
            return {
                scheduledUnits: revisionUnits,
                unscheduledUnits: [],
                targetWorkload,
                actualWorkload: totalRevisionTime,
                utilization: Math.round((totalRevisionTime / targetWorkload) * 100),
                availableMinutes,
                dayEvents
            };
        }
    }

    calculateAvailableTime(events) {
        const DAY_START = 0; // 00:00 in minutes
        const DAY_END = 1440; // 24:00 in minutes

        if (events.length === 0) {
            return DAY_END - DAY_START;
        }

        // Sort events by start time
        const sortedEvents = [...events].sort((a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime));

        let availableTime = 0;
        let lastEndTime = DAY_START;

        for (const event of sortedEvents) {
            const startTime = this.timeToMinutes(event.startTime);
            const endTime = this.timeToMinutes(event.endTime);

            // Add gap before this event
            if (startTime > lastEndTime) {
                availableTime += startTime - lastEndTime;
            }

            lastEndTime = Math.max(lastEndTime, endTime);
        }

        // Add gap after last event
        if (lastEndTime < DAY_END) {
            availableTime += DAY_END - lastEndTime;
        }

        return availableTime;
    }

    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    /**
     * Plan workload for entire week
     */
    async planWeeklyWorkload(userId, weeklyStrategy, userGoals) {
        const weeklyPlan = {};

        for (let day = 0; day < 7; day++) {
            weeklyPlan[day] = await this.planDailyWorkload(userId, day, weeklyStrategy, userGoals);
        }

        return weeklyPlan;
    }
}

module.exports = new DailyWorkloadPlanner();
