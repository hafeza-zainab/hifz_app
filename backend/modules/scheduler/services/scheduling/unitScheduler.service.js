const timelineService = require('./timeline.service');
const revisionUnitRepo = require('../../../../repositories/scheduler/revisionUnit.repository');
const adaptiveSplitter = require('./adaptiveSplitter.service');

class UnitScheduler {
    /**
     * Schedule revision units into available timeline
     */
    async scheduleRevisionUnits(userId, dayOfWeek, revisionUnits) {
        // Build timeline
        const timeline = await timelineService.buildTimeline(userId, dayOfWeek);
        
        // Detect gaps
        const gaps = timelineService.detectGaps(timeline);
        
        // Sort units by priority
        const rankedUnits = [...revisionUnits].sort((a, b) => b.priority - a.priority);
        
        const scheduledUnits = [];
        const usedGaps = new Set();

        for (const unit of rankedUnits) {
            // Find best gap
            const bestGap = this.findBestGap(unit, gaps, usedGaps);
            
            if (!bestGap) {
                unit.isScheduled = false;
                continue;
            }

            if (unit.estimatedTime <= bestGap.duration) {
                // Unit fits in gap
                this.scheduleUnit(unit, bestGap);
                scheduledUnits.push(unit);
                usedGaps.add(bestGap);
            } else if (unit.isSplittable) {
                // Split unit across multiple gaps
                const splitResult = await adaptiveSplitter.splitUnitAcrossGaps(unit, gaps, usedGaps);
                scheduledUnits.push(...splitResult.scheduledUnits);
                splitResult.usedGaps.forEach(gap => usedGaps.add(gap));
            } else {
                // Unit doesn't fit and can't split
                unit.isScheduled = false;
            }
        }

        // Update scheduled units in database
        for (const unit of scheduledUnits) {
            await revisionUnitRepo.update(unit.id, unit);
        }

        return {
            scheduledUnits,
            unscheduledUnits: rankedUnits.filter(u => !u.isScheduled),
            timeline,
            gaps
        };
    }

    findBestGap(unit, gaps, usedGaps) {
        let bestGap = null;
        let bestScore = -1;

        for (const gap of gaps) {
            if (usedGaps.has(gap)) continue;
            if (gap.duration < unit.minTime) continue;

            // Score gap based on fit
            const score = this.scoreGapForUnit(gap, unit);
            
            if (score > bestScore) {
                bestScore = score;
                bestGap = gap;
            }
        }

        return bestGap;
    }

    scoreGapForUnit(gap, unit) {
        // Prefer gaps that fit the unit well
        const durationDiff = Math.abs(gap.duration - unit.estimatedTime);
        const fitScore = Math.max(0, 100 - durationDiff);

        // Prefer larger gaps for splittable units
        const sizeScore = unit.isSplittable ? gap.duration * 0.1 : 0;

        return fitScore + sizeScore;
    }

    scheduleUnit(unit, gap) {
        unit.isScheduled = true;
        unit.scheduledAt = Math.floor(Date.now() / 1000);
        unit.scheduledSlots = [{
            startTime: this.minutesToTime(gap.startTime),
            endTime: this.minutesToTime(gap.endTime),
            pages: unit.pages
        }];
    }

    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    /**
     * Schedule units for entire week
     */
    async scheduleWeeklyUnits(userId, dailyWorkloads) {
        const weeklySchedule = {};

        for (let day = 0; day < 7; day++) {
            const workload = dailyWorkloads[day];
            if (!workload) continue;

            const result = await this.scheduleRevisionUnits(
                userId,
                day,
                workload.scheduledUnits
            );

            weeklySchedule[day] = result;
        }

        return weeklySchedule;
    }
}

module.exports = new UnitScheduler();
