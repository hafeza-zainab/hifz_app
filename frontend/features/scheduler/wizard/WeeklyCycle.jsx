import React, { useState } from 'react';
import SiparaDetailModal from '../components/SiparaDetailModal';

const DAYS = [
  { key: 'monday', label: 'MON' },
  { key: 'tuesday', label: 'TUE' },
  { key: 'wednesday', label: 'WED' },
  { key: 'thursday', label: 'THU' },
  { key: 'friday', label: 'FRI' },
  { key: 'saturday', label: 'SAT' },
  { key: 'sunday', label: 'SUN' }
];

export default function WeeklyCycle({ weeklyCycle, onNext, onBack }) {
  const [selectedSipara, setSelectedSipara] = useState(null);

  if (!weeklyCycle) {
    return <div className="loading">Loading weekly cycle...</div>;
  }

  const handleSiparaClick = (sipara) => {
    const siparaNumber = typeof sipara === 'number'
      ? sipara
      : typeof sipara === 'object'
        ? sipara.number || sipara.siparaNumber
        : parseInt(sipara?.toString().replace(/\D/g, '') || '0');
    if (siparaNumber > 0) {
      setSelectedSipara(siparaNumber);
    }
  };

  // Debug: log the data structure
  console.log('=== WEEKLY CYCLE COMPONENT ===');
  console.log('WeeklyCycle - received weeklyCycle:', weeklyCycle);
  console.log('WeeklyCycle - type:', typeof weeklyCycle);
  console.log('WeeklyCycle - isArray:', Array.isArray(weeklyCycle));
  console.log('WeeklyCycle - keys:', weeklyCycle ? Object.keys(weeklyCycle) : 'N/A');
  console.log('==============================');

  // Handle different API response structures
  const cycleData = Array.isArray(weeklyCycle) ? weeklyCycle : weeklyCycle;

  // Helper function to map numeric score to label
  const getScoreLabel = (score) => {
    if (typeof score === 'string') return score; // Already a label
    if (typeof score === 'number') {
      if (score <= 40) return 'Weak';
      if (score <= 70) return 'OK';
      if (score <= 90) return 'Good';
      return 'Excellent';
    }
    return 'Unknown';
  };

  // Helper function to get sipara display text
  const getSiparaText = (sipara) => {
    // Handle different data structures
    if (typeof sipara === 'number') {
      return `Sipara ${sipara}`;
    }
    if (typeof sipara === 'string') {
      return sipara.startsWith('Sipara') ? sipara : `Sipara ${sipara}`;
    }
    if (sipara && sipara.number) {
      const score = getScoreLabel(sipara.score);
      return `Sipara ${sipara.number} (${score})`;
    }
    if (sipara && sipara.siparaNumber) {
      const score = getScoreLabel(sipara.strength || sipara.score);
      return `Sipara ${sipara.siparaNumber} (${score})`;
    }
    return String(sipara);
  };

  return (
    <div className="weekly-cycle">
      <div className="banner info">
        <div className="banner-icon">📅</div>
        <div className="banner-text">
          Your weekly cycle is auto-generated based on your progress
        </div>
      </div>

      {Array.isArray(cycleData) ? (
        // Handle array format from API
        cycleData.map((day, index) => (
          <div key={index} className="card">
            <div className="card-header">
              <h3 className="card-title">{day.day}</h3>
              {day.label && (
                <span className={`badge ${day.label === 'Hardest' ? 'orange' : day.label === 'Light' || day.label === 'Recovery' ? 'green' : 'purple'}`}>
                  {day.label}
                </span>
              )}
            </div>
            
            {day.siparas && day.siparas.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {day.siparas.map((sipara, i) => (
                  <div
                    key={i}
                    onClick={() => handleSiparaClick(sipara)}
                    style={{
                      fontSize: 14,
                      color: '#374151',
                      padding: '8px 0',
                      borderBottom: '1px solid #F3F4F6',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {getSiparaText(sipara)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      ) : (
        // Handle object format
        DAYS.map((day) => {
          const dayData = cycleData[day.key];
          if (!dayData) return null;

          return (
            <div key={day.key} className="card">
              <div className="card-header">
                <h3 className="card-title">{day.label}</h3>
                <span className={`badge ${dayData.label === 'Hardest' ? 'orange' : dayData.label === 'Light' || dayData.label === 'Recovery' ? 'green' : 'purple'}`}>
                  {dayData.label}
                </span>
              </div>
              
              {dayData.siparas && dayData.siparas.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dayData.siparas.map((sipara, i) => (
                    <div
                      key={i}
                      onClick={() => handleSiparaClick(sipara)}
                      style={{
                        fontSize: 14,
                        color: '#374151',
                        padding: '8px 0',
                        borderBottom: '1px solid #F3F4F6',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {getSiparaText(sipara)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      <button className="pill-button" onClick={onNext} data-tour="weekly-cycle-continue">
        Continue
      </button>

      <button className="pill-button secondary" onClick={onBack}>
        Back
      </button>

      {selectedSipara && (
        <SiparaDetailModal
          siparaNumber={selectedSipara}
          onClose={() => setSelectedSipara(null)}
        />
      )}
    </div>
  );
}
