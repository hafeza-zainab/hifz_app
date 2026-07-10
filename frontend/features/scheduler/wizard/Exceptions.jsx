import React, { useState } from 'react';

const EXCEPTION_ICONS = {
  sports: '⚽',
  quran_class: '🕌',
  family: '👨‍👩‍👧‍👦',
  workshop: '🎓',
  appointment: '📅',
  custom: '📌'
};

export default function Exceptions({ exceptions, onExceptionsChange, onNext, onBack }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newException, setNewException] = useState({
    title: '',
    day: '',
    startTime: '',
    endTime: ''
  });

  const handleAddException = () => {
    if (newException.title && newException.day && newException.startTime && newException.endTime) {
      onExceptionsChange([...exceptions, { ...newException, id: Date.now() }]);
      setNewException({ title: '', day: '', startTime: '', endTime: '' });
      setShowAddForm(false);
    }
  };

  const handleDeleteException = (id) => {
    onExceptionsChange(exceptions.filter(e => e.id !== id));
  };

  const getIconForException = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('sport') || lower.includes('gym')) return EXCEPTION_ICONS.sports;
    if (lower.includes('quran') || lower.includes('class')) return EXCEPTION_ICONS.quran_class;
    if (lower.includes('family') || lower.includes('gathering')) return EXCEPTION_ICONS.family;
    if (lower.includes('workshop') || lower.includes('seminar')) return EXCEPTION_ICONS.workshop;
    if (lower.includes('appointment') || lower.includes('doctor')) return EXCEPTION_ICONS.appointment;
    return EXCEPTION_ICONS.custom;
  };

  return (
    <div className="exceptions">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Exceptions & Events</h2>
          <button 
            className="pill-button" 
            style={{ width: 'auto', padding: '8px 16px', margin: 0, fontSize: 13 }}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            + Add Exception
          </button>
        </div>

        {showAddForm && (
          <div style={{ 
            background: '#F9FAFB', 
            padding: 16, 
            borderRadius: 12, 
            marginBottom: 16 
          }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, display: 'block' }}>
                Title
              </label>
              <input
                type="text"
                value={newException.title}
                onChange={(e) => setNewException({ ...newException, title: e.target.value })}
                placeholder="e.g., Sports Practice"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 6,
                  fontSize: 14
                }}
              />
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, display: 'block' }}>
                Day
              </label>
              <select
                value={newException.day}
                onChange={(e) => setNewException({ ...newException, day: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 6,
                  fontSize: 14
                }}
              >
                <option value="">Select day</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, display: 'block' }}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={newException.startTime}
                  onChange={(e) => setNewException({ ...newException, startTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, display: 'block' }}>
                  End Time
                </label>
                <input
                  type="time"
                  value={newException.endTime}
                  onChange={(e) => setNewException({ ...newException, endTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                />
              </div>
            </div>

            <button 
              className="pill-button" 
              style={{ padding: '10px 20px', fontSize: 13 }}
              onClick={handleAddException}
            >
              Add Exception
            </button>
          </div>
        )}

        {exceptions.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 40, 
            color: '#9CA3AF',
            fontSize: 14 
          }}>
            No exceptions added yet
          </div>
        ) : (
          exceptions.map((exception) => (
            <div key={exception.id} className="time-block">
              <div className="time-block-icon">
                {getIconForException(exception.title)}
              </div>
              <div className="time-block-content">
                <div className="time-block-title">{exception.title}</div>
                <div className="time-block-subtitle">{exception.day}</div>
              </div>
              <div className="time-block-time">
                {exception.startTime} - {exception.endTime}
              </div>
              <button 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#DC2626', 
                  fontSize: 16, 
                  cursor: 'pointer',
                  padding: 8
                }}
                onClick={() => handleDeleteException(exception.id)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <button className="pill-button" onClick={onNext}>
        Review My Week
      </button>
      
      <button className="pill-button secondary" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
