const db = require('../../config/database');

class PageAnalysisRepository {
    async create(analysis) {
        const id = analysis.id || this.generateId();
        const now = Math.floor(Date.now() / 1000);
        
        await db.run(
            `INSERT INTO scheduler_page_analysis 
             (id, user_id, sipara, page, quality, quality_score, mistake_pattern,
              weakness_areas, last_revision_date, days_since_revision, revision_count,
              average_score, score_trend, consecutive_weak_pages, consecutive_good_pages,
              base_time_estimate, time_adjustment, final_time_estimate, analyzed_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                analysis.userId,
                analysis.sipara,
                analysis.page,
                analysis.quality,
                analysis.qualityScore,
                analysis.mistakePattern ? JSON.stringify(analysis.mistakePattern) : null,
                analysis.weaknessAreas ? JSON.stringify(analysis.weaknessAreas) : null,
                analysis.lastRevisionDate || null,
                analysis.daysSinceRevision || 0,
                analysis.revisionCount || 0,
                analysis.averageScore || null,
                analysis.scoreTrend || null,
                analysis.consecutiveWeakPages || 0,
                analysis.consecutiveGoodPages || 0,
                analysis.baseTimeEstimate,
                analysis.timeAdjustment || 0,
                analysis.finalTimeEstimate,
                now,
                now
            ]
        );
        
        return id;
    }

    async getById(id) {
        const row = await db.get('SELECT * FROM scheduler_page_analysis WHERE id = ?', [id]);
        if (!row) return null;
        return this.mapRowToAnalysis(row);
    }

    async getByUserId(userId) {
        const rows = await db.all(
            'SELECT * FROM scheduler_page_analysis WHERE user_id = ? ORDER BY sipara, page',
            [userId]
        );
        return rows.map(row => this.mapRowToAnalysis(row));
    }

    async getBySipara(userId, sipara) {
        const rows = await db.all(
            'SELECT * FROM scheduler_page_analysis WHERE user_id = ? AND sipara = ? ORDER BY page',
            [userId, sipara]
        );
        return rows.map(row => this.mapRowToAnalysis(row));
    }

    async getByPage(userId, sipara, page) {
        const row = await db.get(
            'SELECT * FROM scheduler_page_analysis WHERE user_id = ? AND sipara = ? AND page = ?',
            [userId, sipara, page]
        );
        if (!row) return null;
        return this.mapRowToAnalysis(row);
    }

    async update(id, analysis) {
        const now = Math.floor(Date.now() / 1000);
        
        await db.run(
            `UPDATE scheduler_page_analysis 
             SET quality = ?, quality_score = ?, mistake_pattern = ?, weakness_areas = ?,
                 last_revision_date = ?, days_since_revision = ?, revision_count = ?,
                 average_score = ?, score_trend = ?, consecutive_weak_pages = ?,
                 consecutive_good_pages = ?, base_time_estimate = ?, time_adjustment = ?,
                 final_time_estimate = ?, updated_at = ?
             WHERE id = ?`,
            [
                analysis.quality,
                analysis.qualityScore,
                analysis.mistakePattern ? JSON.stringify(analysis.mistakePattern) : null,
                analysis.weaknessAreas ? JSON.stringify(analysis.weaknessAreas) : null,
                analysis.lastRevisionDate || null,
                analysis.daysSinceRevision,
                analysis.revisionCount,
                analysis.averageScore,
                analysis.scoreTrend,
                analysis.consecutiveWeakPages,
                analysis.consecutiveGoodPages,
                analysis.baseTimeEstimate,
                analysis.timeAdjustment,
                analysis.finalTimeEstimate,
                now,
                id
            ]
        );
        
        return this.getById(id);
    }

    async upsert(userId, sipara, page, analysis) {
        const existing = await this.getByPage(userId, sipara, page);
        
        if (existing) {
            return this.update(existing.id, { ...analysis, userId, sipara, page });
        } else {
            return this.create({ ...analysis, userId, sipara, page });
        }
    }

    async delete(id) {
        await db.run('DELETE FROM scheduler_page_analysis WHERE id = ?', [id]);
    }

    async deleteByUserId(userId) {
        await db.run('DELETE FROM scheduler_page_analysis WHERE user_id = ?', [userId]);
    }

    mapRowToAnalysis(row) {
        return {
            id: row.id,
            userId: row.user_id,
            sipara: row.sipara,
            page: row.page,
            quality: row.quality,
            qualityScore: row.quality_score,
            mistakePattern: row.mistake_pattern ? JSON.parse(row.mistake_pattern) : null,
            weaknessAreas: row.weakness_areas ? JSON.parse(row.weakness_areas) : null,
            lastRevisionDate: row.last_revision_date,
            daysSinceRevision: row.days_since_revision,
            revisionCount: row.revision_count,
            averageScore: row.average_score,
            scoreTrend: row.score_trend,
            consecutiveWeakPages: row.consecutive_weak_pages,
            consecutiveGoodPages: row.consecutive_good_pages,
            baseTimeEstimate: row.base_time_estimate,
            timeAdjustment: row.time_adjustment,
            finalTimeEstimate: row.final_time_estimate,
            analyzedAt: row.analyzed_at,
            updatedAt: row.updated_at
        };
    }

    generateId() {
        return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

module.exports = new PageAnalysisRepository();
