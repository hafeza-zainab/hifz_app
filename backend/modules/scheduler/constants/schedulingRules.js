/**
 * Default scheduling rules
 */

const SCHEDULING_RULES = {
    MIN_GAP_MINUTES: 5,           // Minimum gap between activities
    MIN_SESSION_MINUTES: 5,       // Minimum session duration
    MAX_SESSION_MINUTES: 120,     // Maximum session duration
    DEFAULT_WEEKLY_STRATEGY: {
        0: 0.50,  // Sunday
        1: 1.00,  // Monday
        2: 0.90,  // Tuesday
        3: 0.80,  // Wednesday
        4: 0.75,  // Thursday
        5: 0.65,  // Friday
        6: 0.90   // Saturday
    },
    WORKLOAD_UTILIZATION_TARGET: 0.85,  // Target 85% utilization
    WORKLOAD_UTILIZATION_MIN: 0.50,     // Minimum 50% utilization
    WORKLOAD_UTILIZATION_MAX: 0.95      // Maximum 95% utilization
};

const EVENT_CATEGORIES = {
    SLEEP: 'sleep',
    PRAYER: 'prayer',
    MEAL: 'meal',
    COMMUTE: 'commute',
    SCHOOL: 'school',
    UNIVERSITY: 'university',
    WORK: 'work',
    HOMEWORK: 'homework',
    EXERCISE: 'exercise',
    FAMILY: 'family',
    HOUSE_CHORES: 'house_chores',
    SHOPPING: 'shopping',
    APPOINTMENT: 'appointment',
    QURAN_CLASS: 'quran_class',
    STUDY: 'study',
    LEISURE: 'leisure',
    CUSTOM: 'custom'
};

const RECURRENCE_TYPES = {
    NONE: 'none',
    DAILY: 'daily',
    WEEKDAYS: 'weekdays',
    WEEKENDS: 'weekends',
    CUSTOM: 'custom'
};

const PRIORITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
};

module.exports = {
    SCHEDULING_RULES,
    EVENT_CATEGORIES,
    RECURRENCE_TYPES,
    PRIORITY_LEVELS
};
