//C:\quran-similarity-app\frontend\src\features\diary\DiaryPage.jsx
// Main diary logging interface with tabbed forms for different log types,
// integrated with log history and performance analytics.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthContext } from '../../shared/context/AuthContext';
import { useTour } from '../../shared/context/TourContext';
import useMurajahForm   from './hooks/useMurajahForm';
import useTasmeeForm    from './hooks/useTasmeeForm';
import useIkhtebarForm  from './hooks/useIkhtebarForm';
import useJadeedForm    from './hooks/useJadeedForm';
import useJuzHaliForm   from './hooks/useJuzHaliForm';

import LogHistory               from './components/LogHistory';
import ThemeBanner              from '../../shared/components/ThemeBanner';
import TakhteetProgress         from './components/TakhteetProgress';
import PerformanceAnalyticsView from '../analytics/PerformanceAnalyticsView';
import { addLog, getLogs }      from '../../shared/services/diaryApi';

import MurajahForm  from './components/forms/MurajahForm';
import TasmeeForm   from './components/forms/TasmeeForm';
import IkhtebarForm from './components/forms/IkhtebarForm';
import JadeedForm   from './components/forms/JadeedForm';
import JuzHaliForm  from './components/forms/JuzHaliForm';

// ── Inline Toast ──────────────────────────────────────────────────────────────
function Toast({ message, type, onDismiss }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 3500);
        return () => clearTimeout(t);
    }, [message, onDismiss]);

    const bg    = type === 'error' ? '#FEE2E2' : '#D1FAE5';
    const color = type === 'error' ? '#991B1B' : '#065F46';

    return (
        <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9000,
            background: bg, color, padding: '12px 20px', borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontWeight: 600,
            maxWidth: 360, fontSize: 14, lineHeight: 1.5,
            animation: 'fadeIn 0.2s ease',
        }}>
            {type === 'error' ? '⚠️ ' : '✅ '}{message}
        </div>
    );
}

// ── Inline Confirm Dialog ─────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9001,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{
                background: 'white', padding: '28px 32px', borderRadius: 12,
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)', maxWidth: 360, width: '90%',
            }}>
                <p style={{ marginBottom: 20, color: '#374151', fontWeight: 500 }}>{message}</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#DC2626', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DiaryPage() {
    const { user } = useAuthContext();
    const { dispatchTourEvent } = useTour();

    const todayUTC = new Date().toISOString().split('T')[0];
    const [activeDate, setActiveDate] = useState(todayUTC);
    const [activeTab, setActiveTab]   = useState('murajah');
    const [logs, setLogs]             = useState([]);
    const [isSaving, setIsSaving]     = useState(false); // Fix #5

    const [toast, setToast]                 = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [jadeedLogCounter, setJadeedLogCounter] = useState(0);
    const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

    const murajah  = useMurajahForm();
    const tasmee   = useTasmeeForm();
    const ikhtebar = useIkhtebarForm();
    const jadeed   = useJadeedForm();
    const juzHali  = useJuzHaliForm();

    const TAB_LABELS = {
        murajah:  'MURAJAH',
        tasmee:   'TASMEE',
        ikhtebar: 'IKHTEBAR',
        jadeed:   'JADEED',
        Juz_Hali: 'JUZ HALI',
    };

    const renderActiveForm = () => {
        switch (activeTab) {
            case 'murajah':  return <MurajahForm  hook={murajah} />;
            case 'tasmee':   return <TasmeeForm   hook={tasmee} />;
            case 'ikhtebar': return <IkhtebarForm hook={ikhtebar} />;
            case 'jadeed':   return <JadeedForm   hook={jadeed} />;
            case 'Juz_Hali': return <JuzHaliForm  hook={juzHali} />;
            default: return null;
        }
    };

    // Fix #5 (UTC arithmetic)
    const changeDateByOffset = (offset) => {
        const d = new Date(activeDate + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() + offset);
        const next = d.toISOString().split('T')[0];
        if (next < '2020-01-01') return;
        setActiveDate(next);
    };

    const debounceRef = useRef(null);

 const refreshLogs = useCallback(async (dateOverride) => {
  const target = dateOverride ?? activeDate;
  try {
    const d = await getLogs(target);
    if (d.success) setLogs(d.data);
  } catch (error) {
    // Intentionally silent - logs refresh is background operation
    if (process.env.NODE_ENV !== 'production') {
      console.error('[DiaryPage] Failed to refresh logs:', error);
    }
  }
}, [activeDate]);

    useEffect(() => {
        const controller = new AbortController();
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const d = await getLogs(activeDate);
                if (!controller.signal.aborted && d.success) setLogs(d.data);
            } catch (error) {
                // Intentionally silent - debounced refresh is background operation
                if (process.env.NODE_ENV !== 'production') {
                    console.error('[DiaryPage] Failed to refresh logs (debounced):', error);
                }
            }
        }, 300);
        return () => {
            controller.abort();
            clearTimeout(debounceRef.current);
        };
    }, [activeDate]);

    // Fix #5: guard against double-submit
    const handleSave = async (e) => {
        e.preventDefault();
        if (isSaving) return;
        setIsSaving(true);

        try {
            let res;

            if (activeTab === 'murajah') {
                const payload = { entries: murajah.buildFinalPayload(), date: activeDate };
                if (!payload.entries.length) throw new Error('Please generate a template first.');
                res = await addLog(payload, 'murajah');
            } else if (activeTab === 'tasmee') {
                const payload = { entries: tasmee.buildFinalPayload(), date: activeDate };
                if (!payload.entries.length) throw new Error('Please generate a template first.');
                res = await addLog(payload, 'tasmee');
            } else if (activeTab === 'ikhtebar') {
                const payload = { entries: ikhtebar.buildFinalPayload(), date: activeDate };
                if (!payload.entries.length) throw new Error('Please generate a template first.');
                res = await addLog(payload, 'ikhtebar');
            } else if (activeTab === 'Juz_Hali') {
                const entry = juzHali.buildFinalPayload(activeDate);
                const payload = { entries: [entry], date: activeDate };
                res = await addLog(payload, 'juz-hali');
            }else if (activeTab === 'jadeed') {
                res = await addLog(jadeed.buildFinalPayload(activeDate), 'jadeed');
            }

            if (res?.success) {
                showToast('Log saved successfully!', 'success');
                refreshLogs(activeDate);
                if (activeTab === 'jadeed') {
                    setJadeedLogCounter(prev => prev + 1);
                }
                murajah.resetAll();
                tasmee.resetAll();
                ikhtebar.resetAll();
                jadeed.resetForm();
                juzHali.resetAll();
                try {
                    dispatchTourEvent('diary:entry:added');
                } catch (e) {
                    console.error('[DiaryPage] Error dispatching tour event:', e);
                }
            } else {
                showToast('Failed: ' + (res?.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('[DiaryPage] Failed to save log for date:', activeDate, 'tab:', activeTab, error);
            showToast('Failed: ' + error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="auth-container">
                <div className="auth-card"><h2>Please Login</h2></div>
            </div>
        );
    }

    return (
        <div className="diary-page-container">
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

            {confirmDialog && (
                <ConfirmDialog
                    message={confirmDialog.message}
                    onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                    onCancel={() => setConfirmDialog(null)}
                />
            )}

            <ThemeBanner />
            <TakhteetProgress onLogSaved={jadeedLogCounter} />

            <div className="diary-book">
                <div className="diary-nav-header">
                    <button className="nav-arrow" onClick={() => changeDateByOffset(-1)} disabled={activeDate <= '2020-01-01'}>←</button>
                    <div className="nav-center">
                        <input type="date" value={activeDate} onChange={(e) => setActiveDate(e.target.value)} className="date-picker" />
                    </div>
                    <button className="nav-arrow" onClick={() => changeDateByOffset(1)}>→</button>
                </div>

                <div className="diary-page-content">
                    <div className="diary-card">
                        <h3 style={{ margin: 0, marginBottom: '20px' }}>Log New Entry</h3>

                        <div className="diary-tabs" data-tour="diary-entry-types">
                            {Object.entries(TAB_LABELS).map(([tab, label]) => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? 'active' : ''}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSave} className="log-form">
                            {renderActiveForm()}
                            <button
                                type="submit"
                                className="submit-btn"
                                style={{ marginTop: '20px', opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                                disabled={isSaving}
                                data-tour="diary-save-button"
                            >
                                {isSaving ? '⏳ Saving…' : 'Save Log'}
                            </button>
                        </form>
                    </div>

                    <LogHistory
                        logs={logs}
                        activeDate={activeDate}
                        reload={() => refreshLogs(activeDate)}
                        showToast={showToast}
                        requestConfirm={(message, onConfirm) => setConfirmDialog({ message, onConfirm })}
                    />
                </div>
            </div>

            <PerformanceAnalyticsView activeDate={activeDate} />
        </div>
    );
}