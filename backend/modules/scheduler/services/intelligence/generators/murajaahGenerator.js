const revisionUnitRepo = require('../../../../../repositories/scheduler/revisionUnit.repository');

class MurajaahGenerator {
    /**
     * Generate Muraja'ah (revision) units
     * Groups pages based on quality and revision method
     */
    async generate(userId, pageAnalyses, weeklyCycle) {
        const units = [];
        
        if (!weeklyCycle || !weeklyCycle.activeSiparas) {
            return units;
        }

        // Process each active sipara from weekly cycle
        for (const sipara of weeklyCycle.activeSiparas) {
            const siparaPages = pageAnalyses.filter(p => p.sipara === sipara);
            
            if (siparaPages.length === 0) continue;

            // Sort by page number
            siparaPages.sort((a, b) => a.page - b.page);

            // Group pages based on quality
            const grouped = this.groupPagesByQuality(siparaPages);

            // Create units for each group
            for (const group of grouped) {
                const unit = this.createUnitFromGroup(userId, group, 'murajaah');
                units.push(unit);
            }
        }

        return units;
    }

    groupPagesByQuality(pages) {
        const groups = [];
        let currentGroup = [];

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];

            if (currentGroup.length === 0) {
                currentGroup.push(page);
                continue;
            }

            const lastPage = currentGroup[currentGroup.length - 1];

            // Check if should group with current group
            if (this.shouldGroup(lastPage, page)) {
                currentGroup.push(page);
            } else {
                // Finalize current group
                groups.push([...currentGroup]);
                currentGroup = [page];
            }
        }

        // Add last group
        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }

        return groups;
    }

    shouldGroup(prevPage, currentPage) {
        // Don't group if pages are not consecutive
        if (currentPage.page !== prevPage.page + 1) {
            return false;
        }

        // Excellent pages: single page units
        if (prevPage.aqmosQuality === 'excellent') {
            return false;
        }

        // Very good pages: can group 2-4 consecutive
        if (prevPage.aqmosQuality === 'very_good' && currentPage.aqmosQuality === 'very_good') {
            return true;
        }

        // Good pages: group if same revision method
        if (prevPage.aqmosQuality === 'good' && currentPage.aqmosQuality === 'good') {
            if (prevPage.revisionMethod === currentPage.revisionMethod) {
                return true;
            }
        }

        // Fair/Poor pages: prefer grouping consecutive weak pages
        if (prevPage.aqmosScore <= 4 && currentPage.aqmosScore <= 4) {
            return true;
        }

        return false;
    }

    createUnitFromGroup(userId, pages, workType) {
        const firstPage = pages[0];
        const lastPage = pages[pages.length - 1];
        
        const pageNumbers = pages.map(p => p.page);
        const pageRange = `${firstPage.page}-${lastPage.page}`;

        // Calculate combined estimated time
        const estimatedTime = pages.reduce((sum, p) => sum + p.finalTimeEstimate, 0);
        
        // Calculate min/max times
        const minTime = pages.reduce((sum, p) => sum + p.minTime, 0) || estimatedTime * 0.5;
        const maxTime = pages.reduce((sum, p) => sum + p.maxTime, 0) || estimatedTime * 2;

        // Use average AQMOS score for the unit
        const avgAqmosScore = pages.reduce((sum, p) => sum + p.aqmosScore, 0) / pages.length;
        const avgAqmosQuality = this.getQualityFromScore(avgAqmosScore);

        // Determine if splittable (splittable if more than 1 page or quality allows)
        const isSplittable = pages.length > 1 || avgAqmosQuality !== 'poor';

        return {
            userId,
            workType,
            sipara: firstPage.sipara,
            pages: pageNumbers,
            pageRange,
            aqmosQuality: avgAqmosQuality,
            aqmosScore: avgAqmosScore,
            revisionMethod: firstPage.revisionMethod,
            revisionSteps: firstPage.revisionSteps,
            estimatedTime,
            minTime,
            maxTime,
            priority: 0, // Will be calculated by Priority Engine
            priorityFactors: {},
            isSplittable,
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

module.exports = new MurajaahGenerator();
