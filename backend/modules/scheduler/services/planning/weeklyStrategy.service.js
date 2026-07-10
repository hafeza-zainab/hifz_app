const eventRepo = require('../../../../repositories/scheduler/event.repository');

class WeeklyStrategyService {
    /**
     * Define workload distribution across the week
     * Returns percentage of full workload for each day
     */
    async calculateWeeklyStrategy(userId, commitments) {
        const DEFAULT_WEEKLY_STRATEGY = {
            0: 0.50,  // Sunday - Recovery or catch-up (50%)
            1: 1.00,  // Monday - Heaviest (100%)
            2: 0.90,  // Tuesday - 90%
            3: 0.80,  // Wednesday - 80%
            4: 0.75,  // Thursday - 75%
            5: 0.65,  // Friday - Lighter (65%)
            6: 0.90   // Saturday - 90%
        };

        const strategy = { ...DEFAULT_WEEKLY_STRATEGY };

        // Load user events to detect heavy commitment days
        const events = await eventRepo.getByUserId(userId);
        
        // Calculate workload per day
        const dayWorkload = this.calculateDayWorkload(events);
        
        // Adjust strategy based on workload
        for (let day = 0; day < 7; day++) {
            const workload = dayWorkload[day];
            
            if (workload > 720) { // More than 12 hours of fixed events
                strategy[day] *= 0.5; // 50% reduction
            } else if (workload > 480) { // More than 8 hours
                strategy[day] *= 0.75; // 25% reduction
            }
        }

        // Apply user-defined commitments if provided
        if (commitments) {
            for (const day in commitments) {
                if (commitments[day].isHeavy) {
                    strategy[day] *= 0.5;
                } else if (commitments[day].isModerate) {
                    strategy[day] *= 0.75;
                } else if (commitments[day].isLight) {
                    strategy[day] *= 1.25; // Can handle more
                }
            }
        }

        return strategy;
    }

    calculateDayWorkload(events) {
        const dayWorkload = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

        for (const event of events) {
            for (const day of event.daysOfWeek) {
                dayWorkload[day] += event.duration;
            }
        }

        return dayWorkload;
    }

    /**
     * Get default strategy without user data
     */
    getDefaultStrategy() {
        return {
            0: 0.50,
            1: 1.00,
            2: 0.90,
            3: 0.80,
            4: 0.75,
            5: 0.65,
            6: 0.90
        };
    }

    /**
     * Validate strategy (ensure no day is below minimum threshold)
     */
    validateStrategy(strategy) {
        const MIN_THRESHOLD = 0.3; // Minimum 30% workload
        const validated = { ...strategy };

        for (let day = 0; day < 7; day++) {
            if (validated[day] < MIN_THRESHOLD) {
                validated[day] = MIN_THRESHOLD;
            }
        }

        return validated;
    }
}

module.exports = new WeeklyStrategyService();
