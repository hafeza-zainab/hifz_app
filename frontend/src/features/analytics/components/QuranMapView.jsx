// C:\quran-similarity-app\frontend\src\features\analytics\components\QuranMapView.jsx
// Fix #11: backend returns { juz, page, score } (single z).
//          The previous dataMap used d.juzz which always missed, leaving all
//          cells empty. Corrected to d.juz throughout.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getHeatmapData } from '../../../shared/services/analyticsApi';
import { scoreCategory } from '../../../shared/utils/scoreColors';
import '../../../styles/QuranMapView.css';

const JUZZ_MAX_PAGES = {
    1: 21, 2: 20, 3: 20, 4: 20, 5: 20, 6: 20, 7: 20, 8: 20, 9: 20, 10: 20,
    11: 20, 12: 20, 13: 20, 14: 20, 15: 20, 16: 20, 17: 20, 18: 20, 19: 20, 20: 20,
    21: 20, 22: 20, 23: 20, 24: 20, 25: 20, 26: 20, 27: 20, 28: 20, 29: 20, 30: 23
};

// Cumulative start page for each juz (1-indexed array, index 0 = juz 1)
const JUZZ_START_PAGES = [
    1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
    202, 222, 242, 262, 282, 302, 322, 342, 362,
    382, 402, 422, 442, 462, 482, 502, 522, 542,
    562, 582
];

export default function QuranMapView() {
    const [data, setData]           = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError]         = useState(null);
    const printRef                  = useRef(null);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const res = await getHeatmapData();
                if (!cancelled) {
                    if (res.success) setData(res.data || []);
                    else setError(res.message);
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        fetchData();
        return () => { cancelled = true; };
    }, []);

    // Fix #11: backend sends d.juz (single z), not d.juzz
    const dataMap = useMemo(() => {
        const map = {};
        data.forEach(d => {
            const startPage = JUZZ_START_PAGES[d.juz - 1]; // Fix #11: d.juz not d.juzz
            const localPage = d.page - startPage + 1;
            map[`${d.juz}-${localPage}`] = d;              // Fix #11: d.juz not d.juzz
        });
        return map;
    }, [data]);

    const getActualPage = (j, p) => (JUZZ_START_PAGES[j - 1] || 0) + (p - 1);

    const getColorClass = (cell, exists) => {
        if (!exists) return 'invalid';
        if (!cell)   return 'empty';
        // Use 5-tier rating system from scoreColors.js
        const category = scoreCategory(cell.score);
        return category; // returns: 'poor', 'fair', 'good', 'veryGood', 'excellent'
    };

    const stats = useMemo(() => {
        if (data.length === 0) return null;
        const total  = data.length;
        const avg    = (data.reduce((sum, d) => sum + d.score, 0) / total).toFixed(1);
        const poor      = data.filter(d => d.score <= 2).length;
        const fair      = data.filter(d => d.score > 2 && d.score <= 4).length;
        const good      = data.filter(d => d.score > 4 && d.score <= 6).length;
        const veryGood  = data.filter(d => d.score > 6 && d.score <= 8).length;
        const excellent = data.filter(d => d.score > 8).length;
        return { total, avg, poor, fair, good, veryGood, excellent };
    }, [data]);

    if (isLoading) return <div className="loading-chart">Loading Qur'an Map...</div>;
    if (error)     return <div className="loading-chart" style={{ color: '#ef4444' }}>Error: {error}</div>;

    return (
        <div className="chart-card quran-map-card" data-tour="quran-map">
            {/* Screen-only header */}
            <div className="quran-map-screen-header">
                <div>
                    <h3>📖 Qur'an Map (Murajah Overview)</h3>
                    <p className="heatmap-subtitle">Hover over cells to see page number and score.</p>
                </div>
                <button onClick={() => window.print()} className="print-button">
                    🖨️ Print Map
                </button>
            </div>

            {/* Print-only header */}
            <div className="print-only print-header">
                <h1>Qur'an Map — Murajah Progress Tracker</h1>
                {stats && (
                    <div className="print-stats">
                        <span>Pages Tested: {stats.total}</span>
                        <span>Average: {stats.avg}/10</span>
                        <span className="print-poor">Poor (1–2): {stats.poor}</span>
                        <span className="print-fair">Fair (3–4): {stats.fair}</span>
                        <span className="print-good">Good (5–6): {stats.good}</span>
                        <span className="print-veryGood">Very Good (7–8): {stats.veryGood}</span>
                        <span className="print-excellent">Excellent (9–10): {stats.excellent}</span>
                    </div>
                )}
                <div className="print-date">
                    Generated: {new Date().toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="heatmap-legend" data-tour="quran-map-legend">
                <span className="legend-item empty-box">No Data</span>
                <span className="legend-item poor-box">1–2 (Poor)</span>
                <span className="legend-item fair-box">3–4 (Fair)</span>
                <span className="legend-item good-box">5–6 (Good)</span>
                <span className="legend-item veryGood-box">7–8 (Very Good)</span>
                <span className="legend-item excellent-box">9–10 (Excellent)</span>
                <span className="legend-item invalid-box">N/A</span>
            </div>

            {/* Empty state */}
            {data.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <p style={{ fontWeight: 600 }}>No heatmap data yet</p>
                    <p style={{ fontSize: 13, marginTop: 6 }}>Log some Murajah or Tasmee entries to populate your map.</p>
                </div>
            )}

            {/* Table */}
            {data.length > 0 && (
                <div className="heatmap-scroll-container" ref={printRef}>
                    <table className="heatmap-table">
                        <thead>
                            <tr>
                                <th className="juzz-header">Juz / Pg</th>
                                {Array.from({ length: 23 }, (_, i) => (
                                    <th key={i} className="page-header">{i + 1}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 30 }, (_, i) => {
                                const j   = i + 1;
                                const max = JUZZ_MAX_PAGES[j];

                                return (
                                    <tr key={j}>
                                        <td className="juzz-label">Juz {j}</td>
                                        {Array.from({ length: 23 }, (_, k) => {
                                            const p          = k + 1;
                                            const exists     = p <= max;
                                            const cell       = dataMap[`${j}-${p}`];
                                            const actualPage = getActualPage(j, p);

                                            const tooltip = exists
                                                ? `Juz ${j} - Page ${p}\nActual Page: ${actualPage}\nScore: ${cell?.score ?? '—'}`
                                                : '';

                                            return (
                                                <td
                                                    key={p}
                                                    className={`heatmap-cell ${getColorClass(cell, exists)}`}
                                                    title={tooltip}
                                                >
                                                    {cell?.score ?? ''}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Print-only footer */}
            <div className="print-only print-footer">
                <span>Ikhtebar — Hifz al-Qur'an Platform</span>
            </div>
        </div>
    );
}