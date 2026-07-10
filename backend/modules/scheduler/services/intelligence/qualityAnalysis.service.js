const { getScoresByUser } = require('../../../../repositories/heatmap.repository');
const pageAnalysisRepo = require('../../../../repositories/scheduler/pageAnalysis.repository');

class QualityAnalysisService {
    /**
     * Analyze page quality and determine revision methods
     * Uses existing heatmap scores as quality data
     */
    async analyze(userId) {
        // Get all heatmap scores for user
        const heatmapScores = await getScoresByUser(userId);
        
        if (!heatmapScores || heatmapScores.length === 0) {
            return [];
        }

        // Group by sipara and page
        const pageMap = new Map();
        
        for (const score of heatmapScores) {
            const key = `${score.sipara}_${score.page_number}`;
            pageMap.set(key, {
                userId,
                sipara: score.sipara,
                page: score.page_number,
                qualityScore: score.score,
                quality: this.getQualityFromScore(score.score),
                lastRevisionDate: score.created_at
            });
        }

        // Calculate consecutive weak/good pages per sipara
        const analyses = Array.from(pageMap.values());
        const analysesBySipara = this.groupBySipara(analyses);
        
        for (const sipara in analysesBySipara) {
            const pages = analysesBySipara[sipara].sort((a, b) => a.page - b.page);
            
            // Calculate consecutive weak pages
            let consecutiveWeak = 0;
            let maxConsecutiveWeak = 0;
            
            for (const page of pages) {
                if (page.qualityScore <= 4) {
                    consecutiveWeak++;
                    maxConsecutiveWeak = Math.max(maxConsecutiveWeak, consecutiveWeak);
                } else {
                    consecutiveWeak = 0;
                }
                page.consecutiveWeakPages = maxConsecutiveWeak;
            }
            
            // Calculate consecutive good pages
            let consecutiveGood = 0;
            let maxConsecutiveGood = 0;
            
            for (const page of pages) {
                if (page.qualityScore >= 7) {
                    consecutiveGood++;
                    maxConsecutiveGood = Math.max(maxConsecutiveGood, consecutiveGood);
                } else {
                    consecutiveGood = 0;
                }
                page.consecutiveGoodPages = maxConsecutiveGood;
            }
        }

        // Determine revision method for each page
        for (const analysis of analyses) {
            const revisionData = this.selectRevisionMethod(
                analysis.qualityScore,
                analysis.consecutiveWeakPages
            );
            analysis.revisionMethod = revisionData.method;
            analysis.revisionSteps = revisionData.steps;
            analysis.mistakePattern = this.identifyMistakePatterns(analysis.qualityScore);
            analysis.weaknessAreas = this.identifyWeaknessAreas(analysis.qualityScore);
            
            // Calculate time estimates
            analysis.baseTimeEstimate = this.getBaseTimeEstimate(analysis.quality);
            analysis.timeAdjustment = this.calculateTimeAdjustment(analysis);
            analysis.finalTimeEstimate = analysis.baseTimeEstimate + analysis.timeAdjustment;
            
            // Calculate days since revision
            if (analysis.lastRevisionDate) {
                const now = Math.floor(Date.now() / 1000);
                analysis.daysSinceRevision = Math.floor((now - analysis.lastRevisionDate) / 86400);
            }
            
            analysis.analyzedAt = Math.floor(Date.now() / 1000);
            analysis.updatedAt = analysis.analyzedAt;
        }

        // Save to database
        for (const analysis of analyses) {
            await pageAnalysisRepo.upsert(
                analysis.userId,
                analysis.sipara,
                analysis.page,
                analysis
            );
        }

        return analyses;
    }

    getQualityFromScore(score) {
        if (score >= 9) return 'excellent';
        if (score >= 7) return 'very_good';
        if (score >= 5) return 'good';
        if (score >= 3) return 'fair';
        return 'poor';
    }

    selectRevisionMethod(qualityScore, consecutiveWeak) {
        if (qualityScore >= 9) {
            return {
                method: 'Quick Review',
                steps: ['Single fluent recitation'],
                estimatedMultiplier: 1.0
            };
        }
        else if (qualityScore >= 7) {
            return {
                method: 'Standard Revision',
                steps: ['Read looking', 'Recite without Mushaf', 'Self-test'],
                estimatedMultiplier: 1.5
            };
        }
        else if (qualityScore >= 5) {
            return {
                method: 'Intensive Revision',
                steps: ['Listen once', 'Read looking', 'Repeat five times', 'Recite without Mushaf', 'Partner test'],
                estimatedMultiplier: 2.5
            };
        }
        else {
            return {
                method: 'Rehabilitation',
                steps: ['Listen multiple times', 'Read with tajweed focus', 'Repeat until fluent', 'Partner test', 'Record and compare'],
                estimatedMultiplier: 4.0
            };
        }
    }

    identifyMistakePatterns(qualityScore) {
        const patterns = [];
        
        if (qualityScore < 5) {
            patterns.push('Hifz instability');
            patterns.push('Frequent mistakes');
        }
        if (qualityScore < 3) {
            patterns.push('Major gaps in memorization');
            patterns.push('Tajweed issues');
        }
        
        return patterns;
    }

    identifyWeaknessAreas(qualityScore) {
        const areas = [];
        
        if (qualityScore < 5) {
            areas.push('Fluency');
            areas.push('Accuracy');
        }
        if (qualityScore < 3) {
            areas.push('Memorization retention');
            areas.push('Tajweed rules');
        }
        
        return areas;
    }

    getBaseTimeEstimate(quality) {
        const baseTimes = {
            excellent: 2,
            very_good: 3,
            good: 5,
            fair: 7,
            poor: 12
        };
        return baseTimes[quality] || 5;
    }

    calculateTimeAdjustment(analysis) {
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

    groupBySipara(analyses) {
        const grouped = {};
        for (const analysis of analyses) {
            if (!grouped[analysis.sipara]) {
                grouped[analysis.sipara] = [];
            }
            grouped[analysis.sipara].push(analysis);
        }
        return grouped;
    }
}

module.exports = new QualityAnalysisService();
