//C:\quran-similarity-app\frontend\src\features\diary\components\TakhteetProgress.jsx
import React, { useState, useEffect } from 'react';
import { getTakhteetGoal, createTakhteetGoal, updateTakhteetGoal, getTakhteetProgress } from '../../../shared/services/takhteetApi';

export default function TakhteetProgress({ onLogSaved }) {
    const [goal, setGoal] = useState(null);
    const [progress, setProgress] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const now = new Date();

    // UTC-based check for on-time window (days 1-5)
    const isWithinOnTimeWindow = () => {
        const currentDayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const firstOfMonthUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
        const fifthOfMonthUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 5);
        return currentDayUTC >= firstOfMonthUTC && currentDayUTC <= fifthOfMonthUTC;
    };

    const [formData, setFormData] = useState({
        startJuz: '',
        startPage: '',
        targetJuz: '',
        targetPage: '',
        week1Juz: '',
        week1Page: '',
        week2Juz: '',
        week2Page: '',
        week3Juz: '',
        week3Page: '',
        week4Juz: '',
        week4Page: '',
    });

    const fetchGoal = async () => {
        setLoading(true);
        try {
            const res = await getTakhteetGoal(currentYear, currentMonth);
            if (res.success) {
                setGoal(res.data);
                // Pre-fill form if editing
                setFormData({
                    startJuz: res.data.start_juz || '',
                    startPage: res.data.start_page || '',
                    targetJuz: res.data.target_juz || '',
                    targetPage: res.data.target_page || '',
                    week1Juz: res.data.week1_juz || '',
                    week1Page: res.data.week1_page || '',
                    week2Juz: res.data.week2_juz || '',
                    week2Page: res.data.week2_page || '',
                    week3Juz: res.data.week3_juz || '',
                    week3Page: res.data.week3_page || '',
                    week4Juz: res.data.week4_juz || '',
                    week4Page: res.data.week4_page || '',
                });
            } else {
                setGoal(null);
            }
        } catch (err) {
            console.error('Failed to fetch goal:', err);
            setGoal(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchProgress = async () => {
        try {
            const res = await getTakhteetProgress(currentYear, currentMonth);
            if (res.success) {
                setProgress(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch progress:', err);
        }
    };

    useEffect(() => {
        fetchGoal();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (goal) {
            fetchProgress();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [goal]);

    useEffect(() => {
        if (onLogSaved) {
            fetchProgress();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onLogSaved]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const payload = {
                year: currentYear,
                month: currentMonth,
                startJuz: parseInt(formData.startJuz),
                startPage: parseInt(formData.startPage),
                targetJuz: parseInt(formData.targetJuz),
                targetPage: parseInt(formData.targetPage),
                week1Juz: formData.week1Juz ? parseInt(formData.week1Juz) : null,
                week1Page: formData.week1Page ? parseInt(formData.week1Page) : null,
                week2Juz: formData.week2Juz ? parseInt(formData.week2Juz) : null,
                week2Page: formData.week2Page ? parseInt(formData.week2Page) : null,
                week3Juz: formData.week3Juz ? parseInt(formData.week3Juz) : null,
                week3Page: formData.week3Page ? parseInt(formData.week3Page) : null,
                week4Juz: formData.week4Juz ? parseInt(formData.week4Juz) : null,
                week4Page: formData.week4Page ? parseInt(formData.week4Page) : null,
            };

            let res;
            if (goal) {
                res = await updateTakhteetGoal(goal.id, payload);
            } else {
                res = await createTakhteetGoal(payload);
            }

            if (res.success) {
                setShowForm(false);
                await fetchGoal();
            } else {
                setError(res.message || 'Failed to save goal');
            }
        } catch (err) {
            setError('Failed to save goal: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="diary-card" style={{ padding: '20px', textAlign: 'center' }}>
                Loading...
            </div>
        );
    }

    if (!goal && !showForm) {
        const isLate = !isWithinOnTimeWindow();
        const now = new Date();
        const todayDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

        return (
            <div className="diary-card" style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', color: 'var(--color-deep-green)' }}>Takhteet</h3>
                <p style={{ margin: '0 0 15px 0', color: 'var(--color-body-text)' }}>
                    Set your Takhteet goal for {monthNames[currentMonth - 1]} {currentYear}
                </p>
                {isLate && (
                    <div style={{ 
                        marginBottom: '15px', 
                        padding: '10px 12px', 
                        background: '#FEF3C7', 
                        border: '1px solid #FCD34D', 
                        borderRadius: 6,
                        fontSize: 13,
                        color: '#92400E',
                        lineHeight: 1.5
                    }}>
                        You're setting this goal after {todayDate}. Days 1–{now.getUTCDate()} of the month will show as unplanned; your goal will track from today through the end of the month.
                    </div>
                )}
                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        padding: '8px 16px',
                        background: 'var(--color-islamic-gold)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    Set Goal
                </button>
            </div>
        );
    }

    if (showForm) {
        return (
            <div className="diary-card" style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', color: 'var(--color-deep-green)' }}>
                    {goal ? 'Edit' : 'Set'} Takhteet Goal
                </h3>
                {error && (
                    <div style={{ padding: '10px', background: '#FEE2E2', color: '#991B1B', borderRadius: 6, marginBottom: '15px' }}>
                        {error}
                    </div>
                )}
                <form onSubmit={handleFormSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, color: 'var(--color-body-text)' }}>
                            Start Position
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="number"
                                placeholder="Juz"
                                value={formData.startJuz}
                                onChange={e => setFormData({ ...formData, startJuz: e.target.value })}
                                required
                                min="1"
                                max="30"
                                style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                            />
                            <input
                                type="number"
                                placeholder="Page"
                                value={formData.startPage}
                                onChange={e => setFormData({ ...formData, startPage: e.target.value })}
                                required
                                min="1"
                                style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, color: 'var(--color-body-text)' }}>
                            Target Position
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="number"
                                placeholder="Juz"
                                value={formData.targetJuz}
                                onChange={e => setFormData({ ...formData, targetJuz: e.target.value })}
                                required
                                min="1"
                                max="30"
                                style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                            />
                            <input
                                type="number"
                                placeholder="Page"
                                value={formData.targetPage}
                                onChange={e => setFormData({ ...formData, targetPage: e.target.value })}
                                required
                                min="1"
                                style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, color: 'var(--color-body-text)' }}>
                            Weekly Milestones (Optional)
                        </label>
                        {[1, 2, 3, 4].map(week => (
                            <div key={week} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <span style={{ padding: '8px 0', fontWeight: 600, color: 'var(--color-forest-green)' }}>Week {week}</span>
                                <input
                                    type="number"
                                    placeholder="Juz"
                                    value={formData[`week${week}Juz`]}
                                    onChange={e => setFormData({ ...formData, [`week${week}Juz`]: e.target.value })}
                                    min="1"
                                    max="30"
                                    style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                                />
                                <input
                                    type="number"
                                    placeholder="Page"
                                    value={formData[`week${week}Page`]}
                                    onChange={e => setFormData({ ...formData, [`week${week}Page`]: e.target.value })}
                                    min="1"
                                    style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                                />
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                padding: '10px 20px',
                                background: 'var(--color-islamic-gold)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 6,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                opacity: saving ? 0.7 : 1
                            }}
                        >
                            {saving ? 'Saving...' : 'Save Goal'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            style={{
                                padding: '10px 20px',
                                background: 'white',
                                color: 'var(--color-body-text)',
                                border: '1px solid #D1D5DB',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    if (goal && progress) {
        return (
            <div className="diary-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-deep-green)' }}>Takhteet</h3>
                    <button
                        onClick={() => setShowForm(true)}
                        style={{
                            padding: '4px 12px',
                            background: 'transparent',
                            color: 'var(--color-forest-green)',
                            border: '1px solid var(--color-forest-green)',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600
                        }}
                    >
                        Edit Goal
                    </button>
                </div>

                {goal.is_late && goal.tracking_start_date && (
                    <div style={{ 
                        marginBottom: '15px', 
                        padding: '10px 12px', 
                        background: '#FEF3C7', 
                        border: '1px solid #FCD34D', 
                        borderRadius: 6,
                        fontSize: 13,
                        color: '#92400E',
                        lineHeight: 1.5
                    }}>
                        This goal was set on {new Date(goal.tracking_start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} — days 1–{new Date(goal.tracking_start_date).getUTCDate() - 1} of the month are not counted toward progress or week tracking.
                    </div>
                )}

                <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-body-text)' }}>Monthly Goal</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-islamic-gold)' }}>{progress.monthlyProgressPercent}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${progress.monthlyProgressPercent}%`,
                                background: 'var(--color-forest-green)',
                                transition: 'width 0.3s ease'
                            }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-body-text)' }}>Week {progress.currentWeekNumber} Progress</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-islamic-gold)' }}>{progress.weekProgressPercent}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${progress.weekProgressPercent}%`,
                                background: 'var(--color-mint-green)',
                                transition: 'width 0.3s ease'
                            }}
                        />
                    </div>
                </div>

                <div style={{ fontSize: 14, color: 'var(--color-body-text)', lineHeight: 1.6 }}>
                    <div style={{ marginBottom: '5px' }}>
                        <strong>Current:</strong> Juz {progress.currentJuz} Page {progress.currentPage}
                    </div>
                    <div style={{ marginBottom: '5px' }}>
                        <strong>Target:</strong> Juz {progress.targetJuz} Page {progress.targetPage}
                    </div>
                    <div>
                        <strong>Remaining:</strong> {progress.remainingPages} Pages
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
