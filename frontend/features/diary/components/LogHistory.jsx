// C:\quran-similarity-app\frontend\src\features\diary\components\LogHistory.jsx
import React, { useState } from 'react';
import { deleteLog, updateLog } from '../../../shared/services/diaryApi';
import { scoreColor } from '../../../shared/utils/scoreColors';

export default function LogHistory({ logs, activeDate, reload, showToast, requestConfirm }) {
    const [editingLogId, setEditingLogId] = useState(null);
    const [editScore, setEditScore] = useState(8);

    const startEdit = (log) => { setEditingLogId(log.id); setEditScore(log.score); };
    const cancelEdit = () => setEditingLogId(null);

    const saveEdit = async (id) => {
        const res = await updateLog(id, { score: editScore });
        if (res.success) {
            setEditingLogId(null);
            reload();
            showToast?.('Log updated.', 'success');
        } else {
            showToast?.('Update failed: ' + (res.message || 'Unknown error'), 'error');
        }
    };

    const handleDelete = (id) => {
        requestConfirm?.('Delete this log entry?', async () => {
            const res = await deleteLog(id);
            if (res.success) {
                reload();
                showToast?.('Log deleted.', 'success');
            } else {
                showToast?.('Delete failed: ' + (res.message || 'Unknown error'), 'error');
            }
        });
    };

    return (
        <div className="diary-card" style={{ marginTop: '25px' }} data-tour="diary-timeline">
            <h3>
                History for {new Date(activeDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                })}
            </h3>

            {(!logs || logs.length === 0) ? (
                <p className="empty-state">No logs recorded for this day.</p>
            ) : (
                <div className="logs-list">
                    {logs.map(log => (
                        editingLogId === log.id ? (
                            <div key={log.id} className="log-item edit-mode">
                                <div className="edit-log-form">
                                    <div className="metrics compact">
                                        <div className="metric-group">
                                            <label>Score: <strong style={{ color: scoreColor(editScore) }}>{editScore}/10</strong></label>
                                            <input
                                                type="range" min="0" max="10" step="1"
                                                value={editScore}
                                                onChange={e => setEditScore(Number(e.target.value))}
                                                style={{ accentColor: scoreColor(editScore) }}
                                            />
                                        </div>
                                    </div>
                                    <div className="edit-actions">
                                        <button type="button" className="submit-btn secondary" onClick={cancelEdit}>Cancel</button>
                                        <button type="button" className="submit-btn" onClick={() => saveEdit(log.id)}>Save Changes</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div key={log.id} className="log-item">
                                <div className="log-header">
                                    <span className="log-type">{log.type.replace(/_/g, ' ').toUpperCase()}</span>
                                    <span style={{ fontSize: '13px' }}>
                                        {log.range_from}{log.range_to ? ` → ${log.range_to}` : ''}
                                    </span>
                                </div>
                                <div className="log-stats">
                                    <span style={{ color: scoreColor(log.score), fontWeight: 700 }}>Score: {log.score}/10</span>
                                </div>
                                <div className="log-action-btns">
                                    <button className="icon-btn edit" onClick={() => startEdit(log)}>✏️ Edit</button>
                                    <button className="icon-btn delete" onClick={() => handleDelete(log.id)}>🗑️ Delete</button>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}