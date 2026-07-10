// C:\quran-similarity-app\frontend\src\features\diary\components\forms\MurajahForm.jsx
import React from 'react';
import { scoreColor } from '../../../../shared/utils/scoreColors';

export default function MurajahForm({ hook }) {
    const {
        currentJuzInput, setCurrentJuzInput, availablePages, activeSuwal,
        queuedJuzData, loadPagesForJuz, handleGenerateTemplate,
        addNewSuwal, updateSuwal, removeSuwal, queueJuz
    } = hook;

    return (
        <div className="murajah-container">
            <div className="murajah-juzz-input">
                <label>Enter Juz Number:</label>
                <input
                    type="number" min="1" max="30" value={currentJuzInput}
                    onChange={(e) => { setCurrentJuzInput(e.target.value); loadPagesForJuz(e.target.value); }}
                    placeholder="e.g. 5"
                />
                {availablePages.length > 0 && (
                    <button type="button" className="submit-btn secondary" onClick={handleGenerateTemplate}>
                        Generate Template
                    </button>
                )}
            </div>

            {queuedJuzData.length > 0 && (
                <div className="queued-summary">
                    <strong>Queued for Save:</strong>
                    <div className="queue-badges">
                        {queuedJuzData.map((q, i) => (
                            <span key={i} className="queue-badge">Juz {q.juz} ({q.suwal.length} Suwal)</span>
                        ))}
                    </div>
                </div>
            )}

            {currentJuzInput && availablePages.length > 0 && (
                <div className="suwal-container">
                    <h4>Juz {currentJuzInput} - Active Entry</h4>
                    {activeSuwal.map((s, index) => (
                        <div key={s.id} className="suwal-block">
                            <div className="suwal-header">
                                <strong>سؤال {s.id}</strong>
                                {activeSuwal.length > 1 && (
                                    <button type="button" className="remove-juzz-btn" onClick={() => removeSuwal(index)}>✕</button>
                                )}
                            </div>
                            <div className="suwal-body">
                                <select value={s.page} onChange={(e) => updateSuwal(index, 'page', e.target.value)} required>
                                    <option value="">Select Page</option>
                                    {availablePages.map(p => <option key={p} value={p}>Page {p}</option>)}
                                </select>
                                <div className="metric-group">
    <label>Marks (0-10):</label>
    <input
        type="number"
        min="0"
        max="10"
        value={s.score}
        onChange={(e) => updateSuwal(index, 'score', e.target.value)}
        style={{ color: scoreColor(s.score), fontWeight: 700, width: 80 }}
    />
</div>
                            </div>
                        </div>
                    ))}
                    <div className="suwal-actions">
                        <button type="button" className="secondary-btn" onClick={addNewSuwal}>+ Add سؤال</button>
                        <button type="button" className="secondary-btn" onClick={queueJuz}>Enter Next Juz →</button>
                    </div>
                </div>
            )}
        </div>
    );
}
