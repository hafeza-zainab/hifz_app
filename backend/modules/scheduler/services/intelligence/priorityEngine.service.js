class PriorityEngine {
    /**
     * Calculate multi-factor priority scores for revision units
     */
    calculatePriority(revisionUnit, pageAnalysis, weeklyCycle, userGoals) {
        const factors = {
            aqmosScore: this.calculateAqmosScoreFactor(pageAnalysis),
            consecutiveWeak: this.calculateConsecutiveWeakFactor(pageAnalysis),
            daysSinceRevision: this.calculateDaysSinceRevisionFactor(pageAnalysis),
            currentSipara: this.calculateCurrentSiparaFactor(revisionUnit, weeklyCycle),
            weeklyCycle: this.calculateWeeklyCycleFactor(revisionUnit, weeklyCycle),
            historicalCompletion: this.calculateHistoricalCompletionFactor(pageAnalysis),
            userGoals: this.calculateUserGoalsFactor(revisionUnit, userGoals)
        };

        revisionUnit.priorityFactors = factors;
        revisionUnit.priority = Object.values(factors).reduce((a, b) => a + b, 0);

        return revisionUnit;
    }

    calculateAqmosScoreFactor(pageAnalysis) {
        // Lower score = higher priority
        // Score 1-10 maps to 90-0 priority points
        return (10 - pageAnalysis.aqmosScore) * 10;
    }

    calculateConsecutiveWeakFactor(pageAnalysis) {
        // More consecutive weak pages = higher priority
        return (pageAnalysis.consecutiveWeakPages || 0) * 5;
    }

    calculateDaysSinceRevisionFactor(pageAnalysis) {
        // More days since revision = higher priority
        const days = pageAnalysis.daysSinceRevision || 0;
        return Math.min(days * 2, 30); // Cap at 30 points
    }

    calculateCurrentSiparaFactor(revisionUnit, weeklyCycle) {
        // Current Sipara gets priority boost
        if (!weeklyCycle || !weeklyCycle.currentSipara) {
            return 0;
        }
        return revisionUnit.sipara === weeklyCycle.currentSipara ? 15 : 0;
    }

    calculateWeeklyCycleFactor(revisionUnit, weeklyCycle) {
        // Siparas in weekly cycle get priority
        if (!weeklyCycle || !weeklyCycle.activeSiparas) {
            return 0;
        }
        return weeklyCycle.activeSiparas.includes(revisionUnit.sipara) ? 10 : 0;
    }

    calculateHistoricalCompletionFactor(pageAnalysis) {
        // Lower average score = higher priority
        const avgScore = pageAnalysis.averageScore || pageAnalysis.aqmosScore;
        return (1 - avgScore / 10) * 5;
    }

    calculateUserGoalsFactor(revisionUnit, userGoals) {
        // User-defined goals get priority
        if (!userGoals || !userGoals.workTypes) {
            return 0;
        }
        return userGoals.workTypes.includes(revisionUnit.workType) ? 20 : 0;
    }

    /**
     * Batch calculate priorities for multiple units
     */
    async calculateBatchPriorities(units, pageAnalyses, weeklyCycle, userGoals) {
        const pageAnalysisMap = new Map();
        
        for (const analysis of pageAnalyses) {
            const key = `${analysis.sipara}_${analysis.page}`;
            pageAnalysisMap.set(key, analysis);
        }

        for (const unit of units) {
            // Find relevant page analysis
            const key = `${unit.sipara}_${unit.pages[0]}`;
            const pageAnalysis = pageAnalysisMap.get(key) || {
                aqmosScore: unit.aqmosScore,
                consecutiveWeakPages: 0,
                daysSinceRevision: 0,
                averageScore: unit.aqmosScore
            };

            this.calculatePriority(unit, pageAnalysis, weeklyCycle, userGoals);
        }

        return units;
    }
}

module.exports = new PriorityEngine();
