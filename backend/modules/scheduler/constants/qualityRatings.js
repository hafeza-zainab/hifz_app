/**
 * Quality rating definitions (5-tier system)
 */

const QUALITY_RATINGS = {
    POOR: 'poor',
    FAIR: 'fair',
    GOOD: 'good',
    VERY_GOOD: 'very_good',
    EXCELLENT: 'excellent'
};

const QUALITY_SCORE_RANGES = {
    [QUALITY_RATINGS.POOR]: { min: 1, max: 2 },
    [QUALITY_RATINGS.FAIR]: { min: 3, max: 4 },
    [QUALITY_RATINGS.GOOD]: { min: 5, max: 6 },
    [QUALITY_RATINGS.VERY_GOOD]: { min: 7, max: 8 },
    [QUALITY_RATINGS.EXCELLENT]: { min: 9, max: 10 }
};

const QUALITY_LABELS = {
    [QUALITY_RATINGS.POOR]: 'Poor',
    [QUALITY_RATINGS.FAIR]: 'Fair',
    [QUALITY_RATINGS.GOOD]: 'Good',
    [QUALITY_RATINGS.VERY_GOOD]: 'Very Good',
    [QUALITY_RATINGS.EXCELLENT]: 'Excellent'
};

const BASE_TIME_ESTIMATES = {
    [QUALITY_RATINGS.POOR]: 12,
    [QUALITY_RATINGS.FAIR]: 7,
    [QUALITY_RATINGS.GOOD]: 5,
    [QUALITY_RATINGS.VERY_GOOD]: 3,
    [QUALITY_RATINGS.EXCELLENT]: 2
};

/**
 * Get quality rating from score
 */
function getQualityFromScore(score) {
    for (const [quality, range] of Object.entries(QUALITY_SCORE_RANGES)) {
        if (score >= range.min && score <= range.max) {
            return quality;
        }
    }
    return QUALITY_RATINGS.GOOD; // Default
}

/**
 * Get score range from quality
 */
function getScoreRange(quality) {
    return QUALITY_SCORE_RANGES[quality] || { min: 5, max: 6 };
}

/**
 * Get base time estimate from quality
 */
function getBaseTimeEstimate(quality) {
    return BASE_TIME_ESTIMATES[quality] || 5;
}

module.exports = {
    QUALITY_RATINGS,
    QUALITY_SCORE_RANGES,
    QUALITY_LABELS,
    BASE_TIME_ESTIMATES,
    getQualityFromScore,
    getScoreRange,
    getBaseTimeEstimate
};
