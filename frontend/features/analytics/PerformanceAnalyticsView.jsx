// C:\quran-similarity-app\frontend\src\features\analytics\PerformanceAnalyticsView.jsx
// Fix #6: removed connectNulls from trend chart so gaps are honest.
// Fix #8, #11, #12, #16 also applied.

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { getTrend, getDeepDive } from './../../shared/services/analyticsApi';
import QuranMapView from './components/QuranMapView';
import './../../styles/PerformanceAnalyticsView.css';

function formatDate(dateStr) {
    if (!dateStr) return '';
    try { return new Date(dateStr).toLocaleDateString('en-GB'); } catch { return dateStr; }
}

const barColor = (score) => {
    if (score < 5.75) return '#FCA5A5';
    if (score < 7.75) return '#FDE68A';
    return '#004D40';
};

const TrendTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const val = payload[0].value;
    return (
        <div style={{ background: 'white', border: '1px solid #E5E7EB', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>{label}</p>
            <p style={{ margin: 0, color: val === null ? '#9CA3AF' : '#004D40' }}>
                {val === null ? 'No entries' : `${val}%`}
            </p>
        </div>
    );
};

export default function PerformanceAnalyticsView({ activeDate }) {
    const [selectedType, setSelectedType]         = useState('murajah');
    const [deepDiveRange, setDeepDiveRange]       = useState('7d');
    const [customStart, setCustomStart]           = useState('');
    const [customEnd, setCustomEnd]               = useState('');
    const [useCustomRange, setUseCustomRange]     = useState(false);
    const [trendRange, setTrendRange]             = useState('7d');
    const [trendData, setTrendData]               = useState([]);
    const [deepDiveData, setDeepDiveData]         = useState([]);
    const [activeTab, setActiveTab]               = useState('assessment');
    const [selectedBarIndex, setSelectedBarIndex] = useState(null);
    const deepDiveRef = useRef('');

    useEffect(() => {
        if (useCustomRange && (!customStart || !customEnd)) return;
        const load = async () => {
            try {
                const res = await getTrend(trendRange, customStart, customEnd);
                if (res.success) {
                    setTrendData(res.data.map(d => ({
                        ...d,
                        date: formatDate(d.date),
                        percentage: d.percentage === null ? null : Number(d.percentage),
                    })));
                } else setTrendData([]);
            } catch { setTrendData([]); }
        };
        load();
    }, [trendRange, customStart, customEnd, useCustomRange]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getDeepDive(selectedType, null, deepDiveRange);
                const incoming = res.success ? (res.data || []) : [];
                const s = JSON.stringify(incoming);
                if (s !== deepDiveRef.current) { deepDiveRef.current = s; setDeepDiveData(incoming); }
            } catch { setDeepDiveData([]); }
        };
        load();
    }, [selectedType, deepDiveRange]);

    const getMurajahPanelData = useCallback((data) => {
        const g = {};
        data.logs.forEach(l => { if (!g[l.log_date]) g[l.log_date] = {t:0,c:0}; g[l.log_date].t+=l.score; g[l.log_date].c++; });
        return Object.entries(g).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,10)
            .map(([date,d]) => ({ date: formatDate(date), avgScore: +(d.t/d.c).toFixed(2) }));
    }, []);

    const getTasmeePanelData = useCallback((data) => {
        const g = {};
        data.logs.forEach(l => {
            if (!g[l.log_date]) g[l.log_date] = {t:0,c:0,pages:[]};
            g[l.log_date].t+=l.score; g[l.log_date].c++;
            const m = l.range_from?.match(/Page\s*(\d+)/i);
            if (m) g[l.log_date].pages.push(+m[1]);
        });
        return Object.entries(g).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,d]) => {
            d.pages.sort((a,b)=>a-b);
            const min=d.pages[0], max=d.pages[d.pages.length-1];
            return { date: formatDate(date), pageRange: min===max?`Page ${min}`:`Pages ${min}-${max}`, avgScore: +(d.t/d.c).toFixed(2) };
        });
    }, []);

    const getJadeedPanelData = useCallback((data) => {
        const g = {};
        data.logs.forEach(l => {
            if (!g[l.log_date]) g[l.log_date] = {t:0,c:0,entries:[]};
            g[l.log_date].t+=l.score; g[l.log_date].c++; g[l.log_date].entries.push(l);
        });
        return Object.entries(g).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,d]) => ({
            date: formatDate(date), avgScore: +(d.t/d.c).toFixed(2),
            rangeDisplay: d.entries[0]?.range_to || d.entries[0]?.range_from.replace('Jadeed - ',''),
        }));
    }, []);

    const getJuzzHaliPanelData = useCallback((data) => {
        const g = {};
        data.logs.forEach(l => {
            if (!g[l.log_date]) g[l.log_date] = {t:0,c:0,entries:[]};
            g[l.log_date].t+=l.score; g[l.log_date].c++; g[l.log_date].entries.push(l);
        });
        return Object.entries(g).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,d]) => {
            const pages = d.entries.map(e=>{const m=e.range_from?.match(/Page\s*(\d+)/i);return m?+m[1]:null;}).filter(Boolean).sort((a,b)=>a-b);
            const pr = pages.length ? (pages[0]===pages[pages.length-1]?`Page ${pages[0]}`:`Pages ${pages[0]}-${pages[pages.length-1]}`) : '';
            return { date: formatDate(date), avgScore: +(d.t/d.c).toFixed(2), pageRange: pr, ayahInfo: d.entries.map(e=>e.range_to).filter(Boolean).join(' → ') };
        });
    }, []);

    const getIkhtebarPanelData = useCallback((data) => {
        const g = {};
        data.logs.forEach(l => { if (!g[l.log_date]) g[l.log_date]={t:0,c:0}; g[l.log_date].t+=l.score; g[l.log_date].c++; });
        return Object.entries(g).sort((a,b)=>b[0].localeCompare(a[0]))
            .map(([date,d]) => ({ date: formatDate(date), avgScore: +(d.t/d.c).toFixed(2) }));
    }, []);

    const chartData = useMemo(() => {
        const valid = deepDiveData.filter(d => d.log_date?.length > 5);
        const byJuz = rows => {
            const g = {};
            rows.forEach(l => { const m=l.range_from?.match(/Juz(?:z)?\s+(\d+)/i); if(!m) return; const n=`Juz ${m[1]}`; if(!g[n]) g[n]={t:0,c:0,logs:[]}; g[n].t+=l.score; g[n].c++; g[n].logs.push(l); });
            return Object.entries(g).sort((a,b)=>parseInt(a[0].match(/\d+/)?.[0]||0)-parseInt(b[0].match(/\d+/)?.[0]||0))
                .map(([name,v]) => ({ name, avgScore: +(v.t/v.c).toFixed(2), sessions: v.c, logs: v.logs }));
        };
        const byMonth = rows => {
            const g = {};
            rows.forEach(l => { const k=new Date(l.log_date+'T00:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'}); if(!g[k]) g[k]={t:0,c:0,logs:[]}; g[k].t+=l.score; g[k].c++; g[k].logs.push(l); });
            return Object.entries(g).map(([name,v]) => ({ name, avgScore: +(v.t/v.c).toFixed(2), sessions: v.c, logs: v.logs }));
        };
        if (['murajah','tasmee','ikhtebar'].includes(selectedType)) return byJuz(valid);
        if (['jadeed','juzz_hali'].includes(selectedType)) return byMonth(valid);
        return [];
    }, [deepDiveData, selectedType]);

    const getPanelData = useCallback((row) => {
        if (selectedType === 'murajah')   return getMurajahPanelData(row);
        if (selectedType === 'tasmee')    return getTasmeePanelData(row);
        if (selectedType === 'jadeed')    return getJadeedPanelData(row);
        if (selectedType === 'juzz_hali') return getJuzzHaliPanelData(row);
        if (selectedType === 'ikhtebar')  return getIkhtebarPanelData(row);
        return [];
    }, [selectedType, getMurajahPanelData, getTasmeePanelData, getJadeedPanelData, getJuzzHaliPanelData, getIkhtebarPanelData]);

    const sessionLabel = selectedType === 'tasmee' ? 'Pages' : selectedType === 'murajah' ? 'Sessions' : 'Entries';

    return (
        <div className="analytics-container">
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => { setActiveTab('assessment'); setSelectedBarIndex(null); }} className="deep-select"
                    style={activeTab === 'assessment' ? { backgroundColor: '#004D40', color: 'white', borderColor: '#004D40' } : {}}>
                    📊 Assessment Log
                </button>
                <button onClick={() => setActiveTab('quranmap')} className="deep-select"
                    style={activeTab === 'quranmap' ? { backgroundColor: '#8B5CF6', color: 'white', borderColor: '#8B5CF6' } : {}}>
                    📖 Qur'an Map
                </button>
            </div>

            {activeTab === 'quranmap' ? <QuranMapView /> : (
                <>
                    <div className="chart-card">
                        <div className="chart-header-row">
                            <h3>📈 Assessment Log</h3>
                            <div className="trend-controls">
                                <select value={useCustomRange ? 'custom' : trendRange}
                                    onChange={e => { if (e.target.value === 'custom') setUseCustomRange(true); else { setUseCustomRange(false); setTrendRange(e.target.value); } }}
                                    className="deep-select">
                                    <option value="7d">7 Days</option><option value="1m">1 Month</option>
                                    <option value="3m">3 Months</option><option value="6m">6 Months</option>
                                    <option value="1y">1 Year</option><option value="all">All Time</option>
                                    <option value="custom">Custom Range 📅</option>
                                </select>
                                {useCustomRange && (
                                    <div className="custom-date-range">
                                        <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="date-input" />
                                        <span className="date-separator">to</span>
                                        <input type="date" value={customEnd} max={new Date().toISOString().split('T')[0]} onChange={e => setCustomEnd(e.target.value)} className="date-input" />
                                    </div>
                                )}
                            </div>
                        </div>
                        {trendData.length === 0 ? (
                            <p className="empty-chart">No data for this period. Start logging to see your trend.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                    <Tooltip content={<TrendTooltip />} />
                                    {/* Fix #6: connectNulls removed — gaps are visible and honest */}
                                    <Line type="monotone" dataKey="percentage" stroke="#004D40" strokeWidth={2.5} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="chart-card deep-dive-card analytics-split-view">
                        <div style={{ flex: 1, minWidth: selectedBarIndex !== null ? '60%' : '100%', transition: 'flex 0.3s ease' }}>
                            <h3>🔍 Performance Analytics</h3>
                            <div className="deep-dive-controls">
                                <select value={selectedType} onChange={e => { setSelectedType(e.target.value); setSelectedBarIndex(null); }} className="deep-select">
                                    <option value="murajah">Murajah</option><option value="tasmee">Tasmee</option>
                                    <option value="ikhtebar">Ikhtebar</option><option value="jadeed">Jadeed</option>
                                    <option value="juzz_hali">Juzz Hali</option>
                                </select>
                                <select value={deepDiveRange} onChange={e => { setDeepDiveRange(e.target.value); setSelectedBarIndex(null); }} className="deep-select">
                                    <option value="7d">7 Days</option><option value="1m">1 Month</option>
                                    <option value="3m">3 Months</option><option value="6m">6 Months</option>
                                    <option value="1y">1 Year</option><option value="all">All Time</option>
                                </select>
                            </div>

                            {chartData.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                                    <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                                    <p style={{ fontWeight: 600, fontSize: 15 }}>No history found</p>
                                    <p style={{ fontSize: 13, marginTop: 6 }}>Try a wider time range or log some entries first.</p>
                                </div>
                            ) : (
                                <>
                                    <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10 }}>
                                        Showing latest {Math.min(500, deepDiveData.length)} entries · Click a bar for details
                                    </p>
                                    <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 35)}>
                                        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" domain={[0, 10]} />
                                            <YAxis dataKey="name" width={120} type="category" tick={{ fontSize: 12 }} />
                                            <Tooltip content={() => <div style={{ display: 'none' }} />} />
                                            <Bar dataKey="avgScore" radius={[0, 6, 6, 0]} cursor="pointer" onClick={(_, index) => setSelectedBarIndex(index)}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={barColor(entry.avgScore)}
                                                        stroke={selectedBarIndex === index ? '#1F2937' : 'none'}
                                                        strokeWidth={selectedBarIndex === index ? 2 : 0} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </>
                            )}
                        </div>

                        {selectedBarIndex !== null && chartData[selectedBarIndex] && (
                            <div className="analytics-details-panel">
                                <div className="panel-header-row">
                                    <h3>{chartData[selectedBarIndex].name}</h3>
                                    <button className="close-panel-btn" onClick={() => setSelectedBarIndex(null)}>✕</button>
                                </div>
                                <div className="panel-stats">
                                    <div className="stat-box green-bg">
                                        <span className="stat-value">{chartData[selectedBarIndex].avgScore}/10</span>
                                        <span className="stat-label">Avg Score</span>
                                    </div>
                                    <div className="stat-box blue-bg">
                                        <span className="stat-value">{chartData[selectedBarIndex].sessions}</span>
                                        <span className="stat-label">{sessionLabel}</span>
                                    </div>
                                </div>
                                <div className="panel-logs">
                                    <div className="logs-scroll-container">
                                        {getPanelData(chartData[selectedBarIndex]).map((session, i) => (
                                            <div key={i} className="log-entry-item">
                                                <div className="log-entry-top">
                                                    <span className="log-date">{session.date}</span>
                                                    <span className="log-score">{session.avgScore}/10</span>
                                                </div>
                                                {session.pageRange && <div className="log-entry-meta">{session.pageRange}</div>}
                                                {session.rangeDisplay && <div className="log-entry-meta" style={{ color: '#004D40', fontWeight: 600 }}>{session.rangeDisplay}</div>}
                                                {session.ayahInfo && <div className="log-entry-meta" style={{ color: '#004D40', fontWeight: 600 }}>{session.ayahInfo}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}