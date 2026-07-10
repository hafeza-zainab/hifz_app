/**
 * Work type definitions for scheduler
 */

const WORK_TYPES = {
    MURAJAAH: 'murajaah',
    JUZ_HALI: 'juz_hali',
    JADEED: 'jadeed'
};

const WORK_TYPE_LABELS = {
    [WORK_TYPES.MURAJAAH]: 'Muraja\'ah (Revision)',
    [WORK_TYPES.JUZ_HALI]: 'Juz Hali (Current Juz)',
    [WORK_TYPES.JADEED]: 'Jadeed (New Memorization)'
};

const WORK_TYPE_PRIORITIES = {
    [WORK_TYPES.JADEED]: 100,    // Highest priority
    [WORK_TYPES.JUZ_HALI]: 70,   // High priority
    [WORK_TYPES.MURAJAAH]: 50    // Medium priority
};

module.exports = {
    WORK_TYPES,
    WORK_TYPE_LABELS,
    WORK_TYPE_PRIORITIES
};
