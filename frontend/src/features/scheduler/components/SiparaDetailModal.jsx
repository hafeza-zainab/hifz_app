import React, { useState, useEffect } from 'react';
import { getHeatmapData } from '../../../shared/services/analyticsApi';

// Cumulative start page for each juz (1-indexed array, index 0 = juz 1)
const JUZZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
  202, 222, 242, 262, 282, 302, 322, 342, 362,
  382, 402, 422, 442, 462, 482, 502, 522, 542,
  562, 582
];

export default function SiparaDetailModal({ siparaNumber, onClose }) {
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

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          background: 'white',
          borderRadius: 16,
          width: '90%',
          maxWidth: 500,
          padding: 24,
          textAlign: 'center',
        }}>
          Loading page data...
        </div>
      </div>
    );
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
  const pageScores = {};
  
  // Get start page for this juz
  const startPage = JUZZ_START_PAGES[siparaNumber - 1] || 1;
  
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '90%',
        maxWidth: 500,
        maxHeight: '90vh',
        overflow: 'auto',
        padding: 24,
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#111827' }}>
            Sipara Details
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}
          >
            ×
          </button>
        </div>

        <div className="card" style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h2 className="card-title" style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>
                Sipara {siparaNumber} ({overallQuality})
              </h2>
              <p className="card-subtitle" style={{ margin: 0, fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                Pages 1-20
              </p>
            </div>
            <span className="badge orange" style={{
              background: '#F59E0B',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600,
            }}>
              Sensory Profile Recovery
            </span>
          </div>
          
          <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="stat-label" style={{ fontSize: 13, color: '#6B7280' }}>Duration</span>
            <span className="stat-value" style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{totalDuration} min</span>
          </div>
          
          <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="stat-label" style={{ fontSize: 13, color: '#6B7280' }}>Average Score</span>
            <span className="stat-value" style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{avgScore.toFixed(1)}/10</span>
          </div>
        </div>

        <div className="card" style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}>
          <h3 className="card-title" style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
            Pages
          </h3>
          
          <div className="page-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {pages.map((page) => {
              const score = pageScores[page];
              const color = getScoreColor(score);
              return (
                <div 
                  key={page} 
                  className="page-chip-custom"
                  style={{ 
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: color,
                    color: score >= 5 && score < 7 ? '#000' : '#fff',
                    border: '1px solid rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'default',
                  }}
                  title={`Page ${page}: Score ${score !== null && score !== undefined ? score : 'No data'} (${getScoreLabel(score)})`}
                >
                  {page}
                </div>
              );
            })}
          </div>
          
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6B7280', flexWrap: 'wrap' }}>
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

        <div className="card" style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}>
          <h3 className="card-title" style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
            Method (Sensory Profile-Based)
          </h3>
          
          {methodSteps.map((method) => (
            <div key={method.step} className="method-step" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div className="method-step-number" style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#004D40',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
              }}>
                {method.step}
              </div>
              <div className="method-step-text" style={{ flex: 1, fontSize: 13, color: '#374151' }}>
                {method.text}
              </div>
              {method.count && <div className="method-step-count" style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
                {method.count}
              </div>}
            </div>
          ))}
        </div>

        <div className="card" style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: 16,
        }}>
          <h3 className="card-title" style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
            Target
          </h3>
          
          <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="stat-label" style={{ fontSize: 13, color: '#6B7280' }}>Goal Score</span>
            <span className="stat-value" style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>8.5/10</span>
          </div>
          
          <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="stat-label" style={{ fontSize: 13, color: '#6B7280' }}>Current Avg</span>
            <span className="stat-value" style={{ fontSize: 14, fontWeight: 600, color: getScoreColor(avgScore) }}>{avgScore.toFixed(1)}/10</span>
          </div>
          
          <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="stat-label" style={{ fontSize: 13, color: '#6B7280' }}>Expected Improvement</span>
            <span className="stat-value" style={{ fontSize: 14, fontWeight: 600, color: '#10B981' }}>+25-35%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
