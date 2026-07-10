class AdaptiveSplitter {
    /**
     * Split revision units based on available gaps
     */
    async splitUnitAcrossGaps(unit, gaps, usedGaps) {
        const remainingTime = unit.estimatedTime;
        const remainingPages = [...unit.pages];
        const scheduledSlots = [];
        const usedGapsList = [];

        // Sort gaps by size (largest first)
        const sortedGaps = [...gaps].sort((a, b) => b.duration - a.duration);

        for (const gap of sortedGaps) {
            if (remainingTime <= 0) break;
            if (usedGaps.has(gap)) continue;
            if (gap.duration < 5) continue; // Minimum 5 minutes

            // Calculate how much of this unit fits in this gap
            const slotTime = Math.min(gap.duration, remainingTime);
            const slotPages = this.calculatePagesForTime(slotTime, unit);

            if (slotPages.length === 0) continue;

            scheduledSlots.push({
                startTime: this.minutesToTime(gap.startTime),
                endTime: this.minutesToTime(gap.startTime + slotTime),
                pages: slotPages
            });

            usedGapsList.push(gap);
            remainingTime -= slotTime;
            
            // Remove scheduled pages from remaining
            const pageIndex = remainingPages.indexOf(slotPages[0]);
            if (pageIndex !== -1) {
                remainingPages.splice(pageIndex, slotPages.length);
            }
        }

        unit.scheduledSlots = scheduledSlots;
        unit.isScheduled = scheduledSlots.length > 0;

        return {
            unit,
            scheduledUnits: unit.isScheduled ? [unit] : [],
            usedGaps: usedGapsList
        };
    }

    calculatePagesForTime(time, unit) {
        // Calculate how many pages can be covered in given time
        const timePerPage = unit.estimatedTime / unit.pages.length;
        const pageCount = Math.floor(time / timePerPage);
        
        // Return that many pages from the unit
        return unit.pages.slice(0, Math.min(pageCount, unit.pages.length));
    }

    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    /**
     * Check if a unit can be split
     */
    canSplit(unit) {
        // Unit must be splittable and have more than 1 page
        return unit.isSplittable && unit.pages.length > 1;
    }

    /**
     * Calculate optimal split points for a unit
     */
    calculateOptimalSplits(unit, availableGaps) {
        if (!this.canSplit(unit)) {
            return [unit];
        }

        const splits = [];
        const sortedGaps = [...availableGaps].sort((a, b) => b.duration - a.duration);
        let remainingPages = [...unit.pages];

        for (const gap of sortedGaps) {
            if (remainingPages.length === 0) break;

            const pagesForGap = this.calculatePagesForTime(gap.duration, unit);
            if (pagesForGap.length === 0) continue;

            const splitPages = remainingPages.splice(0, Math.min(pagesForGap.length, remainingPages.length));

            splits.push({
                ...unit,
                id: `${unit.id}_split_${splits.length}`,
                pages: splitPages,
                pageRange: `${splitPages[0]}-${splitPages[splitPages.length - 1]}`,
                estimatedTime: this.calculateTimeForPages(splitPages, unit),
                scheduledSlots: [{
                    startTime: this.minutesToTime(gap.startTime),
                    endTime: this.minutesToTime(gap.startTime + gap.duration),
                    pages: splitPages
                }]
            });
        }

        return splits.length > 0 ? splits : [unit];
    }

    calculateTimeForPages(pages, unit) {
        const timePerPage = unit.estimatedTime / unit.pages.length;
        return Math.round(timePerPage * pages.length);
    }
}

module.exports = new AdaptiveSplitter();
