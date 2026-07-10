class ConstraintService {
    /**
     * Validate schedules against constraints
     */
    validateSchedule(schedule, events) {
        const violations = [];

        for (const day in schedule) {
            const daySchedule = schedule[day];
            if (!daySchedule.events) continue;

            for (const event of daySchedule.events) {
                // Check for overlaps
                const overlaps = this.findOverlaps(event, daySchedule.events);
                if (overlaps.length > 0) {
                    violations.push({
                        type: 'overlap',
                        severity: 'error',
                        event: event,
                        overlaps: overlaps
                    });
                }

                // Check for minimum gaps
                const gapViolations = this.checkMinimumGaps(event, daySchedule.events, 5); // 5 min minimum
                if (gapViolations.length > 0) {
                    violations.push({
                        type: 'insufficient_gap',
                        severity: 'warning',
                        event: event,
                        gaps: gapViolations
                    });
                }
            }
        }

        return violations;
    }

    findOverlaps(event, events) {
        const overlaps = [];
        const eventStart = this.timeToMinutes(event.startTime);
        const eventEnd = this.timeToMinutes(event.endTime);

        for (const other of events) {
            if (other.id === event.id) continue;

            const otherStart = this.timeToMinutes(other.startTime);
            const otherEnd = this.timeToMinutes(other.endTime);

            // Check for overlap
            if (eventStart < otherEnd && eventEnd > otherStart) {
                overlaps.push(other);
            }
        }

        return overlaps;
    }

    checkMinimumGaps(event, events, minGapMinutes) {
        const gaps = [];
        const eventStart = this.timeToMinutes(event.startTime);
        const eventEnd = this.timeToMinutes(event.endTime);

        for (const other of events) {
            if (other.id === event.id) continue;

            const otherStart = this.timeToMinutes(other.startTime);
            const otherEnd = this.timeToMinutes(other.endTime);

            // Check gap before event
            if (otherEnd <= eventStart) {
                const gap = eventStart - otherEnd;
                if (gap < minGapMinutes && gap > 0) {
                    gaps.push({
                        before: other,
                        gapMinutes: gap
                    });
                }
            }

            // Check gap after event
            if (otherStart >= eventEnd) {
                const gap = otherStart - eventEnd;
                if (gap < minGapMinutes && gap > 0) {
                    gaps.push({
                        after: other,
                        gapMinutes: gap
                    });
                }
            }
        }

        return gaps;
    }

    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Check if a revision unit meets constraints
     */
    meetsConstraints(unit, gap, constraints) {
        if (!constraints || constraints.length === 0) {
            return true;
        }

        for (const constraint of constraints) {
            if (!this.checkConstraint(unit, gap, constraint)) {
                return false;
            }
        }

        return true;
    }

    checkConstraint(unit, gap, constraint) {
        switch (constraint.type) {
            case 'min_duration':
                return gap.duration >= constraint.value;
            case 'max_duration':
                return gap.duration <= constraint.value;
            case 'time_window':
                const gapHour = Math.floor(gap.startTime / 60);
                return gapHour >= constraint.startHour && gapHour <= constraint.endHour;
            default:
                return true;
        }
    }

    /**
     * Generate warnings for potential issues
     */
    generateWarnings(schedule) {
        const warnings = [];

        for (const day in schedule) {
            const daySchedule = schedule[day];
            if (!daySchedule.stats) continue;

            // Warning if utilization is too low
            if (daySchedule.stats.utilization < 50) {
                warnings.push({
                    type: 'low_utilization',
                    day: day,
                    message: `Day ${day} has low utilization (${daySchedule.stats.utilization}%)`
                });
            }

            // Warning if utilization is too high
            if (daySchedule.stats.utilization > 95) {
                warnings.push({
                    type: 'high_utilization',
                    day: day,
                    message: `Day ${day} has very high utilization (${daySchedule.stats.utilization}%)`
                });
            }
        }

        return warnings;
    }
}

module.exports = new ConstraintService();
