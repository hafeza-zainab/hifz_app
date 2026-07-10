// C:\quran-similarity-app\frontend\src\features\diary\components\forms\TasmeeForm.jsx
import React from 'react';
import { scoreColor } from '../../../../shared/utils/scoreColors';

export default function TasmeeForm({ hook }) {
    const { tasmeeStart, setTasmeeStart, tasmeeEnd, setTasmeeEnd,
            tasmeeTemplate, generateTemplate, updateTemplate } = hook;

    return (
        <div className="ikhtebar-container">
            <div className="ikhtebar-range-input">
                <div className="range-group">
                    <label>Start Page:</label>
                    <input type="number" min="1" max="604" value={tasmeeStart}
                        onChange={e => setTasmeeStart(e.target.value)} placeholder="e.g. 150" />
                </div>
                <div className="range-group">
                    <label>End Page:</label>
                    <input type="number" min="1" max="604" value={tasmeeEnd}
                        onChange={e => setTasmeeEnd(e.target.value)} placeholder="e.g. 155" />
                </div>
                <button type="button" className="submit-btn secondary" onClick={generateTemplate}>
                    Generate Template
                </button>
            </div>

            {tasmeeTemplate.length > 0 && (
                <>
                    <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                        Juz automatically detected based on page range.
                    </p>
                    {tasmeeTemplate.map((t, index) => (
                        <div key={t.page} className="ikhtebar-block">
                            <h4>Juz {t.juz} - Page {t.page}</h4>
                            <div className="suwal-block">
                                <div className="suwal-body">
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
                </>
            )}
        </div>
    );
}