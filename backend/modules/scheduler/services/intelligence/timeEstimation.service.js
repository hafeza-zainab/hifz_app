class TimeEstimationEngine {
    /**
     * Dynamically calculate time estimates for revision units
     */
    estimateTime(pageAnalysis, revisionMethod, consecutiveWeak) {
        // Base time by quality
        const baseTimes = {
            excellent: 2,
            very_good: 3,
            good: 5,
            fair: 7,
            poor: 12
        };

        let baseTime = baseTimes[pageAnalysis.quality] || 5;

        // Adjust for revision method
        const methodMultipliers = {
            'Quick Review': 1.0,
            'Standard Revision': 1.5,
            'Intensive Revision': 2.5,
            'Rehabilitation': 4.0,
            'Consolidation': 1.2,
            'Reinforcement': 2.0,
            'New Memorization': 1.0
        };

        baseTime *= methodMultipliers[revisionMethod] || 1.5;

        // Adjust for consecutive weak pages
        if (consecutiveWeak > 1) {
            baseTime *= (1 + (consecutiveWeak * 0.1)); // 10% increase per consecutive weak
        }

        // Adjust for days since revision
        if (pageAnalysis.daysSinceRevision > 7) {
            baseTime *= 1.2;
        }

        // Adjust for score trend
        if (pageAnalysis.scoreTrend === 'declining') {
            baseTime *= 1.3;
        }

        return Math.round(baseTime);
    }

    /**
     * Calculate time for multi-page units
     */
    estimateUnitTime(unit, pageAnalyses) {
        if (unit.pages.length === 1) {
            const pageAnalysis = pageAnalyses.find(
                p => p.sipara === unit.sipara && p.page === unit.pages[0]
            );
            if (pageAnalysis) {
                return this.estimateTime(pageAnalysis, unit.revisionMethod, pageAnalysis.consecutiveWeakPages);
            }
            return unit.estimatedTime || 5;
        }

        // For multi-page units, sum individual page times
        let totalTime = 0;
        for (const page of unit.pages) {
            const pageAnalysis = pageAnalyses.find(
                p => p.sipara === unit.sipara && p.page === page
            );
            if (pageAnalysis) {
                totalTime += this.estimateTime(pageAnalysis, unit.revisionMethod, pageAnalysis.consecutiveWeakPages);
            }
        }

        // Apply grouping discount (multi-page units are more efficient)
        totalTime *= 0.9;

        return Math.round(totalTime);
    }

    /**
     * Calculate min and max time bounds
     */
    calculateTimeBounds(estimatedTime, isSplittable, workType) {
        const minTime = estimatedTime * 0.5; // Can be reduced by 50%
        const maxTime = estimatedTime * 2; // Can be extended by 100%

        // Jadeed has tighter bounds
        if (workType === 'jadeed') {
            return {
                minTime: Math.round(estimatedTime * 0.8),
                maxTime: Math.round(estimatedTime * 1.2)
            };
        }

        // Poor quality pages have tighter bounds
        if (!isSplittable) {
            return {
                minTime: Math.round(estimatedTime * 0.8),
                maxTime: Math.round(estimatedTime * 1.5)
            };
        }

        return {
            minTime: Math.round(minTime),
            maxTime: Math.round(maxTime)
        };
    }

    /**
     * Batch estimate times for multiple units
     */
    async estimateBatchTimes(units, pageAnalyses) {
        const pageAnalysisMap = new Map();
        
        for (const analysis of pageAnalyses) {
            const key = `${analysis.sipara}_${analysis.page}`;
            pageAnalysisMap.set(key, analysis);
        }

        for (const unit of units) {
            if (unit.workType === 'jadeed') {
                // Jadeed has fixed time estimates
                unit.estimatedTime = 15 * unit.pages.length;
                const bounds = this.calculateTimeBounds(unit.estimatedTime, unit.isSplittable, unit.workType);
                unit.minTime = bounds.minTime;
                unit.maxTime = bounds.maxTime;
                continue;
            }

            // Find relevant page analyses
            const relevantAnalyses = unit.pages.map(page => {
                const key = `${unit.sipara}_${page}`;
                return pageAnalysisMap.get(key) || {
                    quality: unit.quality,
                    qualityScore: unit.qualityScore,
                    consecutiveWeakPages: 0,
                    daysSinceRevision: 0,
                    scoreTrend: 'stable'
                };
            });

            // Calculate time
            unit.estimatedTime = this.estimateUnitTime(unit, relevantAnalyses);
            
            // Calculate bounds
            const bounds = this.calculateTimeBounds(unit.estimatedTime, unit.isSplittable, unit.workType);
            unit.minTime = bounds.minTime;
            unit.maxTime = bounds.maxTime;
        }

        return units;
    }
}

module.exports = new TimeEstimationEngine();
