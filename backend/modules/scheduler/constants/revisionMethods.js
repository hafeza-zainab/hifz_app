/**
 * AQMOS revision method definitions
 */

const REVISION_METHODS = {
    QUICK_REVIEW: 'Quick Review',
    STANDARD_REVISION: 'Standard Revision',
    INTENSIVE_REVISION: 'Intensive Revision',
    REHABILITATION: 'Rehabilitation',
    CONSOLIDATION: 'Consolidation',
    REINFORCEMENT: 'Reinforcement',
    NEW_MEMORIZATION: 'New Memorization'
};

const REVISION_METHOD_STEPS = {
    [REVISION_METHODS.QUICK_REVIEW]: ['Single fluent recitation'],
    [REVISION_METHODS.STANDARD_REVISION]: ['Read looking', 'Recite without Mushaf', 'Self-test'],
    [REVISION_METHODS.INTENSIVE_REVISION]: ['Listen once', 'Read looking', 'Repeat five times', 'Recite without Mushaf', 'Partner test'],
    [REVISION_METHODS.REHABILITATION]: ['Listen multiple times', 'Read with tajweed focus', 'Repeat until fluent', 'Partner test', 'Record and compare'],
    [REVISION_METHODS.CONSOLIDATION]: ['Review entire range', 'Self-test', 'Identify weak spots'],
    [REVISION_METHODS.REINFORCEMENT]: ['Focus on weak areas', 'Repeat until fluent', 'Partner test'],
    [REVISION_METHODS.NEW_MEMORIZATION]: ['Listen', 'Read with tajweed', 'Repeat until fluent', 'Partner test']
};

const REVISION_METHOD_MULTIPLIERS = {
    [REVISION_METHODS.QUICK_REVIEW]: 1.0,
    [REVISION_METHODS.STANDARD_REVISION]: 1.5,
    [REVISION_METHODS.INTENSIVE_REVISION]: 2.5,
    [REVISION_METHODS.REHABILITATION]: 4.0,
    [REVISION_METHODS.CONSOLIDATION]: 1.2,
    [REVISION_METHODS.REINFORCEMENT]: 2.0,
    [REVISION_METHODS.NEW_MEMORIZATION]: 1.0
};

module.exports = {
    REVISION_METHODS,
    REVISION_METHOD_STEPS,
    REVISION_METHOD_MULTIPLIERS
};
