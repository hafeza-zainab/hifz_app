const eventRepo = require('../../../../repositories/scheduler/event.repository');

class TimelineService {
    /**
     * Build timeline for a specific day
     * Returns sorted events with gaps
     */
    async buildTimeline(userId, dayOfWeek) {
        const events = await eventRepo.getByUserId(userId);
        const dayEvents = events.filter(e => e.daysOfWeek.includes(dayOfWeek));

        // Sort events by start time
        const sortedEvents = [...dayEvents].sort((a, b) => 
            this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
        );

        return {
            dayOfWeek,
            events: sortedEvents
        };
    }

    /**
     * Detect gaps between events
     */
    detectGaps(timeline) {
        const DAY_START = 0; // 00:00 in minutes
        const DAY_END = 1440; // 24:00 in minutes
        const MIN_GAP_MINUTES = 5; // Minimum gap to consider

        const gaps = [];
        const events = timeline.events;

        if (events.length === 0) {
            // Entire day is free
            gaps.push({
                startTime: DAY_START,
                endTime: DAY_END,
                duration: DAY_END,
                dayOfWeek: timeline.dayOfWeek
            });
            return gaps;
        }

        // Gap before first event
        const firstEvent = events[0];
        const firstStartTime = this.timeToMinutes(firstEvent.startTime);
        if (firstStartTime > DAY_START) {
            const gapDuration = firstStartTime - DAY_START;
            if (gapDuration >= MIN_GAP_MINUTES) {
                gaps.push({
                    startTime: DAY_START,
                    endTime: firstStartTime,
                    duration: gapDuration,
                    dayOfWeek: timeline.dayOfWeek,
                    adjacentEvents: [null, firstEvent.id]
                });
            }
        }

        // Gaps between events
        for (let i = 0; i < events.length - 1; i++) {
            const currentEvent = events[i];
            const nextEvent = events[i + 1];

            const gapStart = this.timeToMinutes(currentEvent.endTime);
            const gapEnd = this.timeToMinutes(nextEvent.startTime);
            const gapDuration = gapEnd - gapStart;

            if (gapDuration >= MIN_GAP_MINUTES) {
                gaps.push({
                    startTime: gapStart,
                    endTime: gapEnd,
                    duration: gapDuration,
                    dayOfWeek: timeline.dayOfWeek,
                    adjacentEvents: [currentEvent.id, nextEvent.id]
                });
            }
        }

        // Gap after last event
        const lastEvent = events[events.length - 1];
        const lastEndTime = this.timeToMinutes(lastEvent.endTime);
        if (lastEndTime < DAY_END) {
            const gapDuration = DAY_END - lastEndTime;
            if (gapDuration >= MIN_GAP_MINUTES) {
                gaps.push({
                    startTime: lastEndTime,
                    endTime: DAY_END,
                    duration: gapDuration,
                    dayOfWeek: timeline.dayOfWeek,
                    adjacentEvents: [lastEvent.id, null]
                });
            }
        }

        return gaps;
    }

    /**
     * Build timeline for entire week
     */
    async buildWeeklyTimeline(userId) {
        const weeklyTimeline = {};

        for (let day = 0; day < 7; day++) {
            weeklyTimeline[day] = await this.buildTimeline(userId, day);
        }

        return weeklyTimeline;
    }

    /**
     * Detect gaps for entire week
     */
    async detectWeeklyGaps(userId) {
        const weeklyTimeline = await this.buildWeeklyTimeline(userId);
        const weeklyGaps = {};

        for (let day = 0; day < 7; day++) {
            weeklyGaps[day] = this.detectGaps(weeklyTimeline[day]);
        }

        return weeklyGaps;
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
}

module.exports = new TimelineService();
