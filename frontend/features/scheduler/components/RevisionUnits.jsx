import React from 'react';

const QUALITY_COLORS = {
  excellent: '#10b981',
  very_good: '#3b82f6',
  good: '#f59e0b',
  fair: '#f97316',
  poor: '#ef4444'
};

const WORK_TYPE_LABELS = {
  murajaah: 'Muraja\'ah',
  juz_hali: 'Juz Hali',
  jadeed: 'Jadeed'
};

export default function RevisionUnits({ units, loading }) {
  if (loading) {
    return <div className="loading">Loading revision units...</div>;
  }

  if (!units || units.length === 0) {
    return (
      <div className="revision-units-empty">
        <h2>Revision Units</h2>
        <p>No revision units generated yet. Click "Generate Schedule" to create units.</p>
      </div>
    );
  }

  const groupedUnits = {
    murajaah: units.filter(u => u.workType === 'murajaah'),
    juz_hali: units.filter(u => u.workType === 'juz_hali'),
    jadeed: units.filter(u => u.workType === 'jadeed')
  };

  return (
    <div className="revision-units">
      <h2>Revision Units</h2>
      
      {Object.entries(groupedUnits).map(([workType, typeUnits]) => (
        typeUnits.length > 0 && (
          <div key={workType} className="work-type-section">
            <h3>{WORK_TYPE_LABELS[workType]}</h3>
            <div className="units-grid">
              {typeUnits.map(unit => (
                <div key={unit.id} className="unit-card">
                  <div 
                    className="unit-header"
                    style={{ borderColor: QUALITY_COLORS[unit.quality] }}
                  >
                    <h4>Sipara {unit.sipara}</h4>
                    <span className={`quality-badge ${unit.quality}`}>
                      {unit.quality}
                    </span>
                  </div>
                  <div className="unit-body">
                    <p>Pages: {unit.pageRange}</p>
                    <p>Score: {unit.qualityScore.toFixed(1)}/10</p>
                    <p>Method: {unit.revisionMethod}</p>
                    <p>Time: {unit.estimatedTime} min</p>
                    <p>Priority: {unit.priority.toFixed(0)}</p>
                    {unit.isSplittable && <span className="badge splittable">Splittable</span>}
                    {unit.isScheduled && <span className="badge scheduled">Scheduled</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
