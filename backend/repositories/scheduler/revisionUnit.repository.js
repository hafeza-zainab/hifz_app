const db = require('../../config/database');

class RevisionUnitRepository {
    async create(unit) {
        const id = unit.id || this.generateId();
        const now = Math.floor(Date.now() / 1000);
        
        await db.run(
            `INSERT INTO scheduler_revision_units 
             (id, user_id, work_type, sipara, pages, page_range, quality, quality_score,
              revision_method, revision_steps, estimated_time, min_time, max_time,
              priority, priority_factors, is_splittable, is_scheduled, scheduled_slots,
              requires_units, conflicts_with, generated_at, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                unit.userId,
                unit.workType,
                unit.sipara,
                JSON.stringify(unit.pages),
                unit.pageRange || null,
                unit.quality,
                unit.qualityScore,
                unit.revisionMethod || null,
                unit.revisionSteps ? JSON.stringify(unit.revisionSteps) : null,
                unit.estimatedTime,
                unit.minTime,
                unit.maxTime,
                unit.priority,
                unit.priorityFactors ? JSON.stringify(unit.priorityFactors) : null,
                unit.isSplittable !== false ? 1 : 0,
                0,
                null,
                unit.requiresUnits ? JSON.stringify(unit.requiresUnits) : null,
                unit.conflictsWith ? JSON.stringify(unit.conflictsWith) : null,
                now,
                1
            ]
        );
        
        return id;
    }

    async getById(id) {
        const row = await db.get('SELECT * FROM scheduler_revision_units WHERE id = ?', [id]);
        if (!row) return null;
        return this.mapRowToUnit(row);
    }

    async getByUserId(userId, filters = {}) {
        let query = 'SELECT * FROM scheduler_revision_units WHERE user_id = ? AND is_active = 1';
        const params = [userId];

        if (filters.workType) {
            query += ' AND work_type = ?';
            params.push(filters.workType);
        }

        if (filters.isScheduled !== undefined) {
            query += ' AND is_scheduled = ?';
            params.push(filters.isScheduled ? 1 : 0);
        }

        query += ' ORDER BY priority DESC';

        const rows = await db.all(query, params);
        return rows.map(row => this.mapRowToUnit(row));
    }

    async update(id, unit) {
        await db.run(
            `UPDATE scheduler_revision_units 
             SET is_scheduled = ?, scheduled_slots = ?, scheduled_at = ?, completed_at = ?
             WHERE id = ?`,
            [
                unit.isScheduled ? 1 : 0,
                unit.scheduledSlots ? JSON.stringify(unit.scheduledSlots) : null,
                unit.scheduledAt || null,
                unit.completedAt || null,
                id
            ]
        );
        
        return this.getById(id);
    }

    async delete(id) {
        await db.run('UPDATE scheduler_revision_units SET is_active = 0 WHERE id = ?', [id]);
    }

    async deleteByUserId(userId) {
        await db.run('UPDATE scheduler_revision_units SET is_active = 0 WHERE user_id = ?', [userId]);
    }

    mapRowToUnit(row) {
        return {
            id: row.id,
            userId: row.user_id,
            workType: row.work_type,
            sipara: row.sipara,
            pages: JSON.parse(row.pages),
            pageRange: row.page_range,
            quality: row.quality,
            qualityScore: row.quality_score,
            revisionMethod: row.revision_method,
            revisionSteps: row.revision_steps ? JSON.parse(row.revision_steps) : null,
            estimatedTime: row.estimated_time,
            minTime: row.min_time,
            maxTime: row.max_time,
            priority: row.priority,
            priorityFactors: row.priority_factors ? JSON.parse(row.priority_factors) : null,
            isSplittable: row.is_splittable === 1,
            isScheduled: row.is_scheduled === 1,
            scheduledSlots: row.scheduled_slots ? JSON.parse(row.scheduled_slots) : null,
            requiresUnits: row.requires_units ? JSON.parse(row.requires_units) : null,
            conflictsWith: row.conflicts_with ? JSON.parse(row.conflicts_with) : null,
            generatedAt: row.generated_at,
            scheduledAt: row.scheduled_at,
            completedAt: row.completed_at,
            isActive: row.is_active === 1
        };
    }

    generateId() {
        return `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

module.exports = new RevisionUnitRepository();
