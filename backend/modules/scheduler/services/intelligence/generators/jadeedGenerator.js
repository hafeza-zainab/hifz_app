const revisionUnitRepo = require('../../../../../repositories/scheduler/revisionUnit.repository');

class JadeedGenerator {
    /**
     * Generate Jadeed (new memorization) units
     * Units are typically smaller (1-2 pages) for quality
     */
    async generate(userId, userProgress) {
        const units = [];
        
        if (!userProgress) {
            return units;
        }

        const currentPage = userProgress.currentPage || 1;
        const targetDailyPages = userProgress.dailyTarget || 1;
        const currentSipara = this.getSiparaForPage(currentPage);

        // Create units for target daily pages
        for (let i = 0; i < targetDailyPages; i++) {
            const unitPage = currentPage + i;
            const unitSipara = this.getSiparaForPage(unitPage);
            
            const unit = {
                userId,
                workType: 'jadeed',
                sipara: unitSipara,
                pages: [unitPage],
                pageRange: `${unitPage}`,
                aqmosQuality: 'good', // Default for new memorization
                aqmosScore: 5,
                revisionMethod: 'New Memorization',
                revisionSteps: ['Listen', 'Read with tajweed', 'Repeat until fluent', 'Partner test'],
                estimatedTime: 15, // Base time for new memorization per page
                minTime: 10,
                maxTime: 20,
                priority: 100, // Highest priority for new memorization
                priorityFactors: {
                    userGoals: 50,
                    currentSipara: 30,
                    aqmosScore: 20
                },
                isSplittable: false, // Jadeed should not be split
                isScheduled: false,
                scheduledSlots: null,
                requiresUnits: [],
                conflictsWith: []
            };
            
            units.push(unit);
        }

        return units;
    }

    getSiparaForPage(page) {
        // Approximate mapping (20 pages per sipara)
        return Math.ceil(page / 20);
    }
}

module.exports = new JadeedGenerator();
