import React from 'react';

export default function AdjustUnit({ unit, onBack }) {
  if (!unit) {
    return <div className="loading">Loading unit...</div>;
  }

  const actions = [
    { icon: '📅', label: 'Reschedule', subtitle: 'Change time slot' },
    { icon: '✂️', label: 'Split Unit', subtitle: 'Divide into smaller parts' },
    { icon: '⬆️', label: 'Increase Time', subtitle: 'Add more minutes' },
    { icon: '⬇️', label: 'Decrease Time', subtitle: 'Reduce duration' },
    { icon: '⏭️', label: 'Skip Today', subtitle: 'Move to tomorrow' },
    { icon: '🔄', label: 'Replace Unit', subtitle: 'Choose different pages' }
  ];

  return (
    <div className="adjust-unit">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">{unit.sipara}</h2>
            <p className="card-subtitle">Pages {unit.pages}</p>
          </div>
          <span className="badge orange">
            Quality Recovery
          </span>
        </div>
        
        <div className="stat-row">
          <span className="stat-label">Duration</span>
          <span className="stat-value">{unit.duration}</span>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ fontSize: 16 }}>Customize Unit</h3>
        
        <div className="action-list">
          {actions.map((action) => (
            <div key={action.label} className="action-item">
              <div className="action-icon">{action.icon}</div>
              <div>
                <div className="action-label">{action.label}</div>
                <div className="action-subtitle">{action.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        className="pill-button danger" 
        style={{ marginTop: 16 }}
      >
        Remove Unit
      </button>
      
      <button className="pill-button secondary" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
