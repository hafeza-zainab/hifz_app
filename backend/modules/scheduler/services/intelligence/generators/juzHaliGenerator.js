const revisionUnitRepo = require('../../../../../repositories/scheduler/revisionUnit.repository');

class JuzHaliGenerator {
    /**
     * Generate Juz Hali (current Juz consolidation) units
     * Focuses on consolidation of current Sipara
     */
    async generate(userId, pageAnalyses, currentSipara) {
        const units = [];
        
        if (!currentSipara) {
            return units;
        }

        // Filter pages for current Sipara
        const siparaPages = pageAnalyses.filter(p => p.sipara === currentSipara);
        
        if (siparaPages.length === 0) {
            return units;
        }

        // Sort by page number
        siparaPages.sort((a, b) => a.page - b.page);

        // Separate completed and weak pages
        const completedPages = siparaPages.filter(p => p.qualityScore >= 8);
        const weakPages = siparaPages.filter(p => p.qualityScore < 8);

        // Create consolidation unit for completed pages
        if (completedPages.length > 0) {
            const consolidationUnit = this.createConsolidationUnit(userId, completedPages, currentSipara);
            units.push(consolidationUnit);
        }

        // Create reinforcement units for weak pages
        const weakPageGroups = this.groupConsecutivePages(weakPages);
        
        for (const group of weakPageGroups) {
            const reinforcementUnit = this.createReinforcementUnit(userId, group, currentSipara);
            units.push(reinforcementUnit);
        }

        return units;
    }

    groupConsecutivePages(pages) {
        const groups = [];
        let currentGroup = [];

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];

            if (currentGroup.length === 0) {
                currentGroup.push(page);
                continue;
            }

            const lastPage = currentGroup[currentGroup.length - 1];

            // Group if consecutive
            if (page.page === lastPage.page + 1) {
                currentGroup.push(page);
            } else {
                groups.push([...currentGroup]);
                currentGroup = [page];
            }
        }

        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }

        return groups;
    }

    createConsolidationUnit(userId, pages, sipara) {
        const pageNumbers = pages.map(p => p.page);
        const pageRange = `${pages[0].page}-${pages[pages.length - 1].page}`;
        
        const estimatedTime = pages.reduce((sum, p) => sum + p.finalTimeEstimate, 0);
        const minTime = estimatedTime * 0.5;
        const maxTime = estimatedTime * 1.5;

        return {
            userId,
            workType: 'juz_hali',
            sipara,
            pages: pageNumbers,
            pageRange,
            quality: 'very_good',
            qualityScore: 8,
            revisionMethod: 'Consolidation',
            revisionSteps: ['Review entire range', 'Self-test', 'Identify weak spots'],
            estimatedTime,
            minTime,
            maxTime,
            priority: 50, // High priority for current Juz
            priorityFactors: {
                currentSipara: 30,
                qualityScore: 10,
                daysSinceRevision: 10
            },
            isSplittable: true,
            isScheduled: false,
            scheduledSlots: null,
            requiresUnits: [],
            conflictsWith: []
        };
    }

    createReinforcementUnit(userId, pages, sipara) {
        const pageNumbers = pages.map(p => p.page);
        const pageRange = `${pages[0].page}-${pages[pages.length - 1].page}`;
        
        const avgScore = pages.reduce((sum, p) => sum + p.qualityScore, 0) / pages.length;
        const estimatedTime = pages.reduce((sum, p) => sum + p.finalTimeEstimate, 0);
        const minTime = estimatedTime * 0.8;
        const maxTime = estimatedTime * 2;

        return {
            userId,
            workType: 'juz_hali',
            sipara,
            pages: pageNumbers,
            pageRange,
            quality: this.getQualityFromScore(avgScore),
            qualityScore: avgScore,
            revisionMethod: 'Reinforcement',
            revisionSteps: ['Focus on weak areas', 'Repeat until fluent', 'Partner test'],
            estimatedTime,
            minTime,
            maxTime,
            priority: 70, // Higher priority for weak pages in current Juz
            priorityFactors: {
                currentSipara: 30,
                qualityScore: 20,
                consecutiveWeak: 20
            },
            isSplittable: true,
            isScheduled: false,
            scheduledSlots: null,
            requiresUnits: [],
            conflictsWith: []
        };
    }

    getQualityFromScore(score) {
        if (score >= 9) return 'excellent';
        if (score >= 7) return 'very_good';
        if (score >= 5) return 'good';
        if (score >= 3) return 'fair';
        return 'poor';
    }
}

module.exports = new JuzHaliGenerator();
