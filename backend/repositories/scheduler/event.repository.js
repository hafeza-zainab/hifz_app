const db = require('../../config/database');

class EventRepository {
    async create(event) {
        const id = event.id || this.generateId();
        const now = Math.floor(Date.now() / 1000);
        
        await db.run(
            `INSERT INTO scheduler_events 
             (id, user_id, title, category, start_time, end_time, duration, days_of_week, 
              recurrence, is_fixed, priority, location, notes, source_template, created_at, updated_at, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
              title = excluded.title,
              category = excluded.category,
              start_time = excluded.start_time,
              end_time = excluded.end_time,
              duration = excluded.duration,
              days_of_week = excluded.days_of_week,
              recurrence = excluded.recurrence,
              is_fixed = excluded.is_fixed,
              priority = excluded.priority,
              location = excluded.location,
              notes = excluded.notes,
              source_template = excluded.source_template,
              updated_at = excluded.updated_at,
              is_active = excluded.is_active`,
            [
                id,
                event.userId,
                event.title,
                event.category || 'general',
                event.startTime,
                event.endTime,
                event.duration,
                JSON.stringify(event.daysOfWeek),
                event.recurrence || 'none',
                event.isFixed ? 1 : 0,
                event.priority || 'medium',
                event.location || null,
                event.notes || null,
                event.sourceTemplate || null,
                now,
                now,
                event.isActive !== false ? 1 : 0
            ]
        );
        
        return id;
    }

    async getById(id) {
        const row = await db.get('SELECT * FROM scheduler_events WHERE id = ?', [id]);
        if (!row) return null;
        return this.mapRowToEvent(row);
    }

    async getByUserId(userId) {
        const rows = await db.all(
            'SELECT * FROM scheduler_events WHERE user_id = ? AND is_active = 1 ORDER BY start_time',
            [userId]
        );
        return rows.map(row => this.mapRowToEvent(row));
    }

    async update(id, event) {
        const now = Math.floor(Date.now() / 1000);
        
        await db.run(
            `UPDATE scheduler_events 
             SET title = ?, category = ?, start_time = ?, end_time = ?, duration = ?,
                 days_of_week = ?, recurrence = ?, is_fixed = ?, priority = ?,
                 location = ?, notes = ?, source_template = ?, updated_at = ?, is_active = ?
             WHERE id = ?`,
            [
                event.title,
                event.category,
                event.startTime,
                event.endTime,
                event.duration,
                JSON.stringify(event.daysOfWeek),
                event.recurrence,
                event.isFixed ? 1 : 0,
                event.priority,
                event.location || null,
                event.notes || null,
                event.sourceTemplate || null,
                now,
                event.isActive !== false ? 1 : 0,
                id
            ]
        );
        
        return this.getById(id);
    }

    async delete(id) {
        await db.run('UPDATE scheduler_events SET is_active = 0 WHERE id = ?', [id]);
    }

    async deletePermanently(id) {
        await db.run('DELETE FROM scheduler_events WHERE id = ?', [id]);
    }

    mapRowToEvent(row) {
        const event = {
            id: row.id,
            userId: row.user_id,
            title: row.title,
            category: row.category,
            startTime: row.start_time,
            endTime: row.end_time,
            duration: row.duration,
            daysOfWeek: JSON.parse(row.days_of_week),
            recurrence: row.recurrence,
            isFixed: row.is_fixed === 1,
            priority: row.priority,
            location: row.location,
            notes: row.notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isActive: row.is_active === 1
        };
        
        // Add source_template if column exists and has value
        if (row.source_template !== undefined) {
            event.sourceTemplate = row.source_template;
        }
        
        return event;
    }

    generateId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

module.exports = new EventRepository();
