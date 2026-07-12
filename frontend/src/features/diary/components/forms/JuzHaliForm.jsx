// C:\quran-similarity-app\frontend\src\features\diary\components\forms\JuzzHaliForm.jsx
import React, { useId } from 'react';
import { scoreColor } from '../../../../shared/utils/scoreColors';

export default function JuzHaliForm({ hook }) {
    const uid = useId();
    const {
        fromPage, setFromPage, toPage, setToPage,
        fromPageDetails, toPageDetails,
        fromSelectedSurah, setFromSelectedSurah,
        toSelectedSurah, setToSelectedSurah,
        fromAyah, setFromAyah, toAyah, setToAyah,
        score, setScore, getValidAyahs
    } = hook;

    const fromAyahListId = `${uid}-juzzHali-from-ayah-list`;
    const toAyahListId   = `${uid}-juzzHali-to-ayah-list`;

    return (
        <>
            <div className="jadeed-range-container">
                <div className="jadeed-side">
                    <div className="range-group">
                        <label>From Page:</label>
                        <input type="number" min="1" placeholder="e.g. 50" value={fromPage} onChange={e => setFromPage(e.target.value)} required />
                    </div>
                    <div className="range-group">
                        <label>From Surah:</label>
                        {!fromPageDetails?.surahs && <input type="text" disabled value="Select Page First" />}
                        {fromPageDetails?.surahs?.length === 1 && <input type="text" disabled value={fromPageDetails.surahs[0].name} className="auto-surah-text" />}
                        {fromPageDetails?.surahs?.length > 1 && (
                            <select value={fromSelectedSurah} onChange={e => setFromSelectedSurah(e.target.value)} required>
                                <option value="">Select Surah</option>
                                {fromPageDetails.surahs.map(s => <option key={s.surah} value={s.surah}>{s.name}</option>)}
                            </select>
                        )}
                        {fromPageDetails?.surahs?.length === 0 && <input type="text" disabled value="No surahs found" />}
                    </div>
                    <div className="range-group">
                        <label>From Ayah:</label>
                        <input
                            type="number"
                            disabled={!fromSelectedSurah}
                            list={fromAyahListId}
                            placeholder="Ayah"
                            value={fromAyah}
                            onChange={e => setFromAyah(e.target.value)}
                            required
                        />
                        <datalist id={fromAyahListId}>
                            {getValidAyahs(fromPageDetails, fromSelectedSurah).map(a => <option key={a} value={a} />)}
                        </datalist>
                    </div>
                </div>

                <span className="arrow-divider">→</span>

                <div className="jadeed-side">
                    <div className="range-group">
                        <label>To Page:</label>
                        <input type="number" min="1" placeholder="e.g. 51" value={toPage} onChange={e => setToPage(e.target.value)} />
                    </div>
                    <div className="range-group">
                        <label>To Surah:</label>
                        {!toPageDetails?.surahs && <input type="text" disabled value="Select Page First" />}
                        {toPageDetails?.surahs?.length === 1 && <input type="text" disabled value={toPageDetails.surahs[0].name} className="auto-surah-text" />}
                        {toPageDetails?.surahs?.length > 1 && (
                            <select value={toSelectedSurah} onChange={e => setToSelectedSurah(e.target.value)} required>
                                <option value="">Select Surah</option>
                                {toPageDetails.surahs.map(s => <option key={s.surah} value={s.surah}>{s.name}</option>)}
                            </select>
                        )}
                        {toPageDetails?.surahs?.length === 0 && <input type="text" disabled value="No surahs found" />}
                    </div>
                    <div className="range-group">
                        <label>To Ayah:</label>
                        <input
                            type="number"
                            disabled={!toSelectedSurah}
                            list={toAyahListId}
                            placeholder="Ayah"
                            value={toAyah}
                            onChange={e => setToAyah(e.target.value)}
                            required
                        />
                        <datalist id={toAyahListId}>
                            {getValidAyahs(toPageDetails, toSelectedSurah).map(a => <option key={a} value={a} />)}
                        </datalist>
                    </div>
                </div>
            </div>

            <div className="form-row metrics">
    <div className="metric-group">
        <label>Score (0-10):</label>
        <input
            type="number"
            min="0" max="10"
            value={score}
            onChange={e => setScore(e.target.value)}
            style={{ color: scoreColor(score), fontWeight: 700, width: 80 }}
        />
    </div>
</div>
        </>
    );
}