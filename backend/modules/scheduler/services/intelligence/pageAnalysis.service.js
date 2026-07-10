const pageAnalysisRepo = require('../../../../repositories/scheduler/pageAnalysis.repository');
const { getUserDiary } = require('../../../../repositories/diary.repository');

class PageAnalysisService {
    /**
     * Analyze pages with historical tracking
     * Builds on AQMOS analysis and adds revision history
     */
    async analyze(userId, aqmosAnalysis) {
        const analyses = aqmosAnalysis || await pageAnalysisRepo.getByUserId(userId);
        
        if (!analyses || analyses.length === 0) {
            return [];
        }

        // Fetch diary logs for historical data
        const diaryLogs = await getUserDiary(userId);
        
        // Calculate historical metrics for each page
        for (const analysis of analyses) {
            // Find relevant diary logs for this sipara
            const relevantLogs = diaryLogs.filter(log => {
                const logSipara = this.extractSiparaFromRange(log.range_from);
                return logSipara === analysis.sipara;
            });

            // Calculate revision count
            analysis.revisionCount = relevantLogs.length;

            // Calculate average score from diary
            if (relevantLogs.length > 0) {
                const totalScore = relevantLogs.reduce((sum, log) => sum + log.score, 0);
                analysis.averageScore = totalScore / relevantLogs.length;
            }

            // Calculate score trend
            analysis.scoreTrend = this.calculateScoreTrend(relevantLogs);

            // Update time estimates based on historical data
            analysis.timeAdjustment = this.calculateHistoricalTimeAdjustment(analysis);
            analysis.finalTimeEstimate = analysis.baseTimeEstimate + analysis.timeAdjustment;

            // Update database
            await pageAnalysisRepo.upsert(
                analysis.userId,
                analysis.sipara,
                analysis.page,
                analysis
            );
        }

        return analyses;
    }

    calculateScoreTrend(logs) {
        if (logs.length < 2) return 'stable';

        const recentLogs = logs.slice(-5); // Last 5 logs
        const scores = recentLogs.map(log => log.score);
        
        const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
        const secondHalf = scores.slice(Math.floor(scores.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        if (secondAvg > firstAvg + 1) return 'improving';
        if (secondAvg < firstAvg - 1) return 'declining';
        return 'stable';
    }

    calculateHistoricalTimeAdjustment(analysis) {
        let adjustment = 0;

        // Base adjustment from AQMOS
        adjustment += this.calculateBaseAdjustment(analysis);

        // Historical adjustment
        if (analysis.scoreTrend === 'declining') {
            adjustment += 5; // More time needed if declining
        }
        if (analysis.scoreTrend === 'improving') {
            adjustment -= 2; // Less time needed if improving
        }

        // Revision count adjustment
        if (analysis.revisionCount > 10) {
            adjustment -= 1; // Familiar pages need less time
        }

        return Math.max(0, adjustment);
    }

    calculateBaseAdjustment(analysis) {
        let adjustment = 0;

        // Adjust for consecutive weak pages
        if (analysis.consecutiveWeakPages > 1) {
            adjustment += analysis.consecutiveWeakPages * 2;
        }

        // Adjust for days since revision
        if (analysis.daysSinceRevision > 7) {
            adjustment += 3;
        }

        return adjustment;
    }

    extractSiparaFromRange(range) {
        // Range format: "14-18" or similar
        // Need to map page range to sipara
        // This is a simplified version - should use actual page-to-sipara mapping
        const page = parseInt(range.split('-')[0]);
        return Math.ceil(page / 20); // Approximate (20 pages per sipara)
    }

    async getBySipara(userId, sipara) {
        return await pageAnalysisRepo.getBySipara(userId, sipara);
    }

    async getByPage(userId, sipara, page) {
        return await pageAnalysisRepo.getByPage(userId, sipara, page);
    }

    async update(id, analysis) {
        return await pageAnalysisRepo.update(id, analysis);
    }
}

module.exports = new PageAnalysisService();
