// C:\quran-similarity-app\frontend\src\features\tasks\components\DailyTask.jsx
// Fix #8: added isLoading state + skeleton so the task list doesn't flash
//         "No tasks set" briefly on every date change before the fetch returns.

import React, { useState, useEffect } from 'react';
import { useTour } from '../../../shared/context/TourContext';
import { getTasks, addTask, updateTask, editTaskTitle, deleteTask } from '../../../shared/services/taskApi';
import '../../../styles/DailyTasks.css';

// ── Simple skeleton row ───────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <div className="task-item" style={{ opacity: 0.5 }}>
            <div style={{ flex: 1, height: 14, background: '#E5E7EB', borderRadius: 4 }} />
            <div style={{ width: 60, height: 14, background: '#E5E7EB', borderRadius: 4 }} />
            <div style={{ width: 80, height: 14, background: '#E5E7EB', borderRadius: 4 }} />
        </div>
    );
}

export default function DailyTasksPage({ activeDate }) {
    const { dispatchTourEvent } = useTour();
    const [tasks, setTasks]       = useState([]);
    const [isLoading, setLoading] = useState(true); // Fix #8
    const [newTask, setNewTask]   = useState('');
    const [category, setCategory] = useState('murajah');
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText]   = useState('');

    const categories = [
        { value: 'murajah', label: 'MURAJAH' },
        { value: 'Juz_Hali', label: 'Juz_Hali' },
        { value: 'jadeed', label: 'JADEED' },
        { value: 'tasmee', label: 'TASMEE' },
        { value: 'general', label: 'GENERAL' },
    ];

    const categoryLabel = (value) =>
        categories.find((item) => item.value === value)?.label || value.replace('_', ' ').toUpperCase();

    const refreshTasks = async (date) => {
        setLoading(true);
        try {
            const res = await getTasks(date || activeDate);
            if (res.success) setTasks(res.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshTasks(activeDate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeDate]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newTask.trim() || newTask.length > 60) return;
        const res = await addTask({ title: newTask.trim(), category });
        if (res.success) {
            setNewTask('');
            refreshTasks(activeDate);
            try {
                dispatchTourEvent('task:added');
            } catch (e) {
                console.error('[DailyTask] Error dispatching tour event:', e);
            }
        }
    };

    const handleDelete = async (id) => {
        await deleteTask(id);
        refreshTasks(activeDate);
    };

    const startEdit = (task) => { setEditingId(task.id); setEditText(task.title); };

    const saveEdit = async (id) => {
        await editTaskTitle(id, editText.trim());
        setEditingId(null);
        refreshTasks(activeDate);
    };

    const handleStatusChange = async (id, status) => {
        await updateTask(id, status);
        refreshTasks(activeDate);
        try {
            dispatchTourEvent('task:status:changed');
        } catch (e) {
            console.error('[DailyTask] Error dispatching tour event:', e);
        }
    };

    return (
        <div className="diary-card">
            <h3>Tasks &amp; Targets</h3>

            <form onSubmit={handleAdd} className="task-form">
                <select value={category} onChange={e => setCategory(e.target.value)}>
                    {categories.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                </select>
                <div className="input-wrapper">
                    <input
                        type="text"
                        placeholder="e.g., Revise Juz 10"
                        value={newTask}
                        onChange={e => { if (e.target.value.length <= 60) setNewTask(e.target.value); }}
                        required
                        maxLength={60}
                    />
                    <span className="char-limit">{newTask.length}/60</span>
                </div>
                <button type="submit" data-tour="diary-add-task">Add</button>
            </form>

            <div className="task-list">
                {/* Fix #8: show skeleton while loading */}
                {isLoading ? (
                    <>
                        <SkeletonRow />
                        <SkeletonRow />
                        <SkeletonRow />
                    </>
                ) : tasks.length === 0 ? (
                    <p className="empty-tasks">No tasks set for this day.</p>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className={`task-item ${task.status}`}>
                            {editingId === task.id ? (
                                <div className="edit-wrapper">
                                    <input
                                        type="text"
                                        value={editText}
                                        onChange={e => setEditText(e.target.value)}
                                        autoFocus
                                        onKeyDown={e => e.key === 'Enter' && saveEdit(task.id)}
                                    />
                                    <button className="icon-btn save" onClick={() => saveEdit(task.id)}>✓</button>
                                </div>
                            ) : (
                                <div className="task-title">{task.title}</div>
                            )}

                            <span className={`task-badge ${task.category}`}>{categoryLabel(task.category)}</span>

                            <div className="task-actions">
                                {editingId !== task.id && (
                                    <button className="icon-btn edit" onClick={() => startEdit(task)}>✏️</button>
                                )}
                                <button className="icon-btn delete" onClick={() => handleDelete(task.id)}>🗑️</button>
                                <select
                                    value={task.status}
                                    onChange={e => handleStatusChange(task.id, e.target.value)}
                                    className="task-status-select"
                                    data-tour="diary-status-update"
                                >
                                    <option value="pending">Not Started</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed ✓</option>
                                </select>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
