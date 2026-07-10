const db = require('../../config/database');

class ScheduleRepository {
    async create(schedule) {
        const id = schedule.id || this.generateId();
        const now = Math.floor(Date.now() / 1000);
        
        await db.run(
            `INSERT INTO scheduler_schedules 
             (id, user_id, week_start, schedule, generated_at, algorithm_version,
              weekly_workload, conflicts, warnings)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                schedule.userId,
                schedule.weekStart,
                JSON.stringify(schedule.schedule),
                now,
                schedule.algorithmVersion || '1.0.0',
                schedule.weeklyWorkload ? JSON.stringify(schedule.weeklyWorkload) : null,
                schedule.conflicts ? JSON.stringify(schedule.conflicts) : null,
                schedule.warnings ? JSON.stringify(schedule.warnings) : null
            ]
        );
        
        return id;
    }

    async getById(id) {
        const row = await db.get('SELECT * FROM scheduler_schedules WHERE id = ?', [id]);
        if (!row) return null;
        return this.mapRowToSchedule(row);
    }

    async getByUserIdAndWeek(userId, weekStart) {
        const row = await db.get(
            'SELECT * FROM scheduler_schedules WHERE user_id = ? AND week_start = ?',
            [userId, weekStart]
        );
        if (!row) return null;
        return this.mapRowToSchedule(row);
    }

    async getLatestByUserId(userId) {
        const row = await db.get(
            'SELECT * FROM scheduler_schedules WHERE user_id = ? ORDER BY week_start DESC LIMIT 1',
            [userId]
        );
        if (!row) return null;
        return this.mapRowToSchedule(row);
    }

    async update(id, schedule) {
        await db.run(
            `UPDATE scheduler_schedules 
             SET schedule = ?, weekly_workload = ?, conflicts = ?, warnings = ?
             WHERE id = ?`,
            [
                JSON.stringify(schedule.schedule),
                schedule.weeklyWorkload ? JSON.stringify(schedule.weeklyWorkload) : null,
                schedule.conflicts ? JSON.stringify(schedule.conflicts) : null,
                schedule.warnings ? JSON.stringify(schedule.warnings) : null,
                id
            ]
        );
        
        return this.getById(id);
    }

    async delete(id) {
        await db.run('DELETE FROM scheduler_schedules WHERE id = ?', [id]);
    }

    async deleteByUserId(userId) {
        await db.run('DELETE FROM scheduler_schedules WHERE user_id = ?', [userId]);
    }

    mapRowToSchedule(row) {
        return {
            id: row.id,
            userId: row.user_id,
            weekStart: row.week_start,
            schedule: JSON.parse(row.schedule),
            generatedAt: row.generated_at,
            algorithmVersion: row.algorithm_version,
            weeklyWorkload: row.weekly_workload ? JSON.parse(row.weekly_workload) : null,
            conflicts: row.conflicts ? JSON.parse(row.conflicts) : null,
            warnings: row.warnings ? JSON.parse(row.warnings) : null
        };
    }

    generateId() {
        return `sch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

module.exports = new ScheduleRepository();
