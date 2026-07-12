import React, { useState, useEffect } from 'react';
import { getHeatmapData } from '../../../shared/services/analyticsApi';

// Cumulative start page for each juz (1-indexed array, index 0 = juz 1)
const JUZZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
  202, 222, 242, 262, 282, 302, 322, 342, 362,
  382, 402, 422, 442, 462, 482, 502, 522, 542,
  562, 582
];

export default function UnitDetails({ unit, onNext, onBack }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getHeatmapData();
        if (res.success) {
          setHeatmapData(res.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch heatmap data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!unit) {
    return <div className="loading">Loading unit details...</div>;
  }

  if (isLoading) {
    return <div className="loading">Loading page data...</div>;
  }

  // Each Sipara has exactly 20 pages
  const pages = Array.from({ length: 20 }, (_, i) => i + 1);
  
  // Score-based color mapping
  const getScoreColor = (score) => {
    if (score === null || score === undefined) return '#9CA3AF'; // Missing data - Gray
    if (score >= 9) return '#1B4332'; // Excellent - Dark Green
    if (score >= 7) return '#52B788'; // Very Good - Light Green
    if (score >= 5) return '#F1C40F'; // Good - Yellow
    if (score >= 3) return '#E67E22'; // Fair - Orange
    if (score >= 1) return '#C0392B'; // Poor - Red
    return '#9CA3AF'; // Default gray
  };
  
  const getScoreLabel = (score) => {
    if (score === null || score === undefined) return 'Unknown';
    if (score >= 9) return 'Excellent';
    if (score >= 7) return 'Very Good';
    if (score >= 5) return 'Good';
    if (score >= 3) return 'Fair';
    if (score >= 1) return 'Poor';
    return 'Unknown';
  };
  
  // Time per page based on score
  const getTimePerPage = (score) => {
    if (score === null || score === undefined) return 0; // No data: 0 min
    if (score >= 9) return 1;  // Excellent: 1 min
    if (score >= 7) return 2;  // Very Good: 2 min
    if (score >= 5) return 3;  // Good: 3 min
    if (score >= 3) return 4;  // Fair: 4 min
    if (score >= 1) return 5;  // Poor: 5 min
    return 3; // Default: 3 min
  };
  
  // Get actual page scores from heatmap data for this sipara (juz)
  console.log('UnitDetails: unit.sipara:', unit.sipara, 'type:', typeof unit.sipara);
  const siparaNumber = typeof unit.sipara === 'number' ? unit.sipara : parseInt(unit.sipara?.toString().replace(/\D/g, '') || '0');
  console.log('UnitDetails: parsed siparaNumber:', siparaNumber);
  console.log('UnitDetails: heatmapData length:', heatmapData.length);
  
  // Log raw entries to see field names
  console.log('UnitDetails: Raw heatmap entries (first 3):', heatmapData.slice(0, 3).map(e => ({
    juz: e.juz,
    page: e.page,
    score: e.score,
    allKeys: Object.keys(e)
  })));
  
  // Log entries that might match siparaNumber
  const matchingEntries = heatmapData.filter(entry => {
    const entryJuz = entry.juz;
    return entryJuz === siparaNumber || entryJuz === siparaNumber.toString();
  });
  console.log(`UnitDetails: Entries matching juz ${siparaNumber}:`, matchingEntries.slice(0, 5).map(e => ({
    juz: e.juz,
    page: e.page,
    score: e.score,
    pageType: typeof e.page,
    allKeys: Object.keys(e)
  })));
  
  // Log page values from matching entries
  const pageValues = matchingEntries.map(e => e.page);
  console.log(`UnitDetails: Page values from matching entries:`, pageValues);
  
  const pageScores = {};
  
  // Get start page for this juz
  const startPage = JUZZ_START_PAGES[siparaNumber - 1] || 1;
  console.log(`UnitDetails: Juz ${siparaNumber} starts at absolute page ${startPage}`);
  
  // Map heatmap data (juz/page/score) to sipara/page scores
  // Convert absolute page numbers to relative page numbers within the juz
  heatmapData.forEach(entry => {
    const entryJuz = entry.juz;
    const juzMatch = entryJuz === siparaNumber || entryJuz === siparaNumber.toString();
    if (juzMatch) {
      // Convert absolute page to relative page (1-20 within the juz)
      const relativePage = entry.page - startPage + 1;
      if (relativePage >= 1 && relativePage <= 20) {
        pageScores[relativePage] = entry.score;
      }
    }
  });
  
  console.log(`UnitDetails: Sipara ${siparaNumber} page scores:`, pageScores);
  console.log(`UnitDetails: Number of pages with data:`, Object.keys(pageScores).length);
  
  // Calculate total duration based on page scores
  const totalDuration = pages.reduce((sum, page) => {
    const score = pageScores[page];
    if (score === null || score === undefined) return sum; // Skip pages with no data
    return sum + getTimePerPage(score);
  }, 0);
  
  // Calculate average score (only from pages with data)
 const pagesWithData = pages.filter(page => pageScores[page] !== null && pageScores[page] !== undefined);
  const avgScore = pagesWithData.length > 0 
    ? pagesWithData.reduce((sum, page) => sum + pageScores[page], 0) / pagesWithData.length
    : 0;
  
  // Get overall quality label
  const overallQuality = getScoreLabel(avgScore);

  const methodSteps = [
    { step: 1, text: 'Listen Once', count: '' },
    { step: 2, text: 'Read Looking', count: '3x' },
    { step: 3, text: 'Recite Without Mushaf', count: '5x' },
    { step: 4, text: 'Partner Test', count: '1x' }
  ];

  return (
    <div className="unit-details">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Sipara {unit.sipara?.toString().replace(/Sipara\s*/gi, '').replace(/Sipara\s*/gi, '') || 'Unknown'} ({overallQuality})</h2>
            <p className="card-subtitle">Pages 1-20</p>
          </div>
          <span className="badge orange">
            Sensory Profile Recovery
          </span>
        </div>
        
        <div className="stat-row">
          <span className="stat-label">Duration</span>
          <span className="stat-value">{totalDuration} min</span>
        </div>
        
        <div className="stat-row">
          <span className="stat-label">Average Score</span>
          <span className="stat-value">{avgScore.toFixed(1)}/10</span>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ fontSize: 16 }}>Pages</h3>
        
        <div className="page-chips">
          {pages.map((page) => {
            const score = pageScores[page];
            const color = getScoreColor(score);
            console.log(`Page ${page}: score=${score}, type=${typeof score}, color=${color}`);
            return (
              <div 
                key={page} 
                className="page-chip-custom"
                style={{ 
                  backgroundColor: color,
                  color: score >= 5 && score < 7 ? '#000' : '#fff',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}
                title={`Page ${page}: Score ${score !== null && score !== undefined ? score : 'No data'} (${getScoreLabel(score)})`}
              >
                {page}
              </div>
            );
          })}
        </div>
        
        <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: '#6B7280', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, background: '#C0392B', borderRadius: 50 }}></span>
            Poor (1-2): 5min
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, background: '#E67E22', borderRadius: 50 }}></span>
            Fair (3-4): 4min
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, background: '#F1C40F', borderRadius: 50 }}></span>
            Good (5-6): 3min
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, background: '#52B788', borderRadius: 50 }}></span>
            Very Good (7-8): 2min
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, background: '#1B4332', borderRadius: 50 }}></span>
            Excellent (9-10): 1min
          </span>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ fontSize: 16 }}>Method (Sensory Profile-Based)</h3>
        
        {methodSteps.map((method) => (
          <div key={method.step} className="method-step">
            <div className="method-step-number">{method.step}</div>
            <div className="method-step-text">{method.text}</div>
            {method.count && <div className="method-step-count">{method.count}</div>}
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="card-title" style={{ fontSize: 16 }}>Target</h3>
        
        <div className="stat-row">
          <span className="stat-label">Goal Score</span>
          <span className="stat-value">8.5/10</span>
        </div>
        
        <div className="stat-row">
          <span className="stat-label">Current Avg</span>
          <span className="stat-value" style={{ color: getScoreColor(avgScore) }}>{avgScore.toFixed(1)}/10</span>
        </div>
        
        <div className="stat-row">
          <span className="stat-label">Expected Improvement</span>
          <span className="stat-value" style={{ color: '#10B981' }}>+25-35%</span>
        </div>
      </div>

      <button className="pill-button" onClick={onNext}>
        Adjust Unit
      </button>
      
      <button className="pill-button secondary" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
