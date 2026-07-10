// C:\quran-similarity-app\frontend\src\features\diary\components\forms\IkhtebarForm.jsx
import React from 'react';
import { scoreColor } from '../../../../shared/utils/scoreColors';

export default function IkhtebarForm({ hook }) {
    const { ikhtebarFrom, setIkhtebarFrom, ikhtebarTo, setIkhtebarTo,
            ikhtebarTemplate, ikhtebarPagesMap, generateTemplate, updateTemplate } = hook;

    return (
        <div className="ikhtebar-container">
            <div className="ikhtebar-range-input">
                <div className="range-group">
                    <label>From Juz:</label>
                    <input type="number" min="1" max="30" value={ikhtebarFrom}
                        onChange={e => setIkhtebarFrom(e.target.value)} placeholder="1" />
                </div>
                <div className="range-group">
                    <label>To Juz:</label>
                    <input type="number" min="1" max="30" value={ikhtebarTo}
                        onChange={e => setIkhtebarTo(e.target.value)} placeholder="30" />
                </div>
                <button type="button" className="submit-btn secondary" onClick={generateTemplate}>
                    Generate Template
                </button>
            </div>

            {ikhtebarTemplate.length > 0 && ikhtebarTemplate.map((t, index) => (
                <div key={t.juz} className="ikhtebar-block">
                    <h4>Juz {t.juz}</h4>
                    <div className="suwal-block">
                        <div className="suwal-header"><strong>سؤال 1</strong></div>
                        <div className="suwal-body">
                            <select value={t.page} onChange={(e) => updateTemplate(index, 'page', e.target.value)} required>
                                <option value="">Select Page</option>
                                {(ikhtebarPagesMap[t.juz] || []).map(p =>
                                    <option key={p} value={p}>Page {p}</option>
                                )}
                            </select>
                            <div className="metric-group">
                                <label>Marks (0-10):</label>
                                <input
                                    type="number"
                                    min="0" max="10"
                                    value={t.score}
                                    onChange={(e) => updateTemplate(index, 'score', e.target.value)}
                                    style={{ color: scoreColor(t.score), fontWeight: 700, width: 80 }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}