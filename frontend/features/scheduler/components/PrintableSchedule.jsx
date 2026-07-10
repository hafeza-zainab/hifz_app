import React from 'react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Cumulative start page for each juz (1-indexed array, index 0 = juz 1)
const JUZZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
  202, 222, 242, 262, 282, 302, 322, 342, 362,
  382, 402, 422, 442, 462, 482, 502, 522, 542,
  562, 582
];

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
  if (score === null || score === undefined) return 0;
  if (score >= 9) return 1;
  if (score >= 7) return 2;
  if (score >= 5) return 3;
  if (score >= 3) return 4;
  if (score >= 1) return 5;
  return 3;
};

// Calculate duration for a sipara based on page scores from heatmap data
const calculateSiparaDuration = (siparaNumber, heatmapData) => {
  const pageScores = {};
  
  const startPage = JUZZ_START_PAGES[siparaNumber - 1] || 1;
  
  heatmapData.forEach(entry => {
    const entryJuz = entry.juz;
    const juzMatch = entryJuz === siparaNumber || entryJuz === siparaNumber.toString();
    if (juzMatch) {
      const relativePage = entry.page - startPage + 1;
      if (relativePage >= 1 && relativePage <= 20) {
        pageScores[relativePage] = entry.score;
      }
    }
  });
  
  const pages = Array.from({ length: 20 }, (_, i) => i + 1);
  return pages.reduce((sum, page) => {
    const score = pageScores[page];
    if (score === null || score === undefined) return sum;
    return sum + getTimePerPage(score);
  }, 0);
};

// Get average score for a sipara from heatmap data
const getSiparaAvgScore = (siparaNumber, heatmapData) => {
  const pageScores = {};
  
  const startPage = JUZZ_START_PAGES[siparaNumber - 1] || 1;
  
  heatmapData.forEach(entry => {
    const entryJuz = entry.juz;
    const juzMatch = entryJuz === siparaNumber || entryJuz === siparaNumber.toString();
    if (juzMatch) {
      const relativePage = entry.page - startPage + 1;
      if (relativePage >= 1 && relativePage <= 20) {
        pageScores[relativePage] = entry.score;
      }
    }
  });
  
  const pages = Array.from({ length: 20 }, (_, i) => i + 1);
  const pagesWithData = pages.filter(page => pageScores[page] !== null && pageScores[page] !== undefined);
  const sum = pagesWithData.reduce((sum, page) => sum + pageScores[page], 0);
  return pagesWithData.length > 0 ? sum / pagesWithData.length : 0;
};

// Get schedule for a specific day from weekly cycle data
const getDaySchedule = (weeklyCycle, dayIndex, heatmapData) => {
  if (!weeklyCycle) {
    return [];
  }
  
  // Handle array format
  if (Array.isArray(weeklyCycle)) {
    const dayData = weeklyCycle.find(d => d.day === dayIndex);
    if (dayData && dayData.siparas) {
      return dayData.siparas.map((sipara, index) => {
        const siparaNumber = typeof sipara === 'number' 
          ? sipara 
          : typeof sipara === 'object' 
            ? sipara.number 
            : parseInt(sipara?.toString().replace(/\D/g, '') || '0');
        const avgScore = getSiparaAvgScore(siparaNumber, heatmapData);
        const duration = calculateSiparaDuration(siparaNumber, heatmapData);
        const quality = getScoreLabel(avgScore);
        
        const startHour = 5 + Math.floor(duration * index / 60);
        const startMin = (duration * index) % 60;
        const endHour = 5 + Math.floor(duration * (index + 1) / 60);
        const endMin = (duration * (index + 1)) % 60;
        
        return {
          time: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}–${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
          sipara: `Sipara ${siparaNumber}`,
          pages: '1-20',
          duration: `${duration} min`,
          method: index % 3 === 0 ? 'Quick Revision' : index % 3 === 1 ? 'Quality Recovery' : 'Normal Revision',
          quality: quality,
          avgScore
        };
      });
    }
  }
  
  // Handle object format with numeric string keys
  if (typeof weeklyCycle === 'object') {
    const dayKey = String(dayIndex);
    
    if (weeklyCycle[dayKey]?.siparas) {
      return weeklyCycle[dayKey].siparas.map((sipara, index) => {
        const siparaNumber = typeof sipara === 'number' 
          ? sipara 
          : typeof sipara === 'object' 
            ? sipara.number 
            : parseInt(sipara?.toString().replace(/\D/g, '') || '0');
        const avgScore = getSiparaAvgScore(siparaNumber, heatmapData);
        const duration = calculateSiparaDuration(siparaNumber, heatmapData);
        const quality = getScoreLabel(avgScore);
        
        const startHour = 5 + Math.floor(duration * index / 60);
        const startMin = (duration * index) % 60;
        const endHour = 5 + Math.floor(duration * (index + 1) / 60);
        const endMin = (duration * (index + 1)) % 60;
        
        return {
          time: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}–${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
          sipara: `Sipara ${siparaNumber}`,
          pages: '1-20',
          duration: `${duration} min`,
          method: index % 3 === 0 ? 'Quick Revision' : index % 3 === 1 ? 'Quality Recovery' : 'Normal Revision',
          quality: quality,
          avgScore
        };
      });
    }
    
    // Fallback: try to find by day name
    const dayNameKey = Object.keys(weeklyCycle).find(key => 
      key.toLowerCase().includes(DAY_NAMES[dayIndex].toLowerCase())
    );
    if (dayNameKey && weeklyCycle[dayNameKey]?.siparas) {
      return weeklyCycle[dayNameKey].siparas.map((sipara, index) => {
        const siparaNumber = typeof sipara === 'number' 
          ? sipara 
          : typeof sipara === 'object' 
            ? sipara.number 
            : parseInt(sipara?.toString().replace(/\D/g, '') || '0');
        const avgScore = getSiparaAvgScore(siparaNumber, heatmapData);
        const duration = calculateSiparaDuration(siparaNumber, heatmapData);
        const quality = getScoreLabel(avgScore);
        
        const startHour = 5 + Math.floor(duration * index / 60);
        const startMin = (duration * index) % 60;
        const endHour = 5 + Math.floor(duration * (index + 1) / 60);
        const endMin = (duration * (index + 1)) % 60;
        
        return {
          time: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}–${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
          sipara: `Sipara ${siparaNumber}`,
          pages: '1-20',
          duration: `${duration} min`,
          method: index % 3 === 0 ? 'Quick Revision' : index % 3 === 1 ? 'Quality Recovery' : 'Normal Revision',
          quality: quality,
          avgScore
        };
      });
    }
  }
  
  return [];
};

export default function PrintableSchedule({ schedule, weeklyCycle, heatmapData }) {
  // Pre-compute all day schedules from the actual schedule data
  const allDaySchedules = (() => {
    // Try to use schedule data first
    if (schedule && schedule.days && Array.isArray(schedule.days)) {
      try {
        return schedule.days.map((daySchedule) => {
          const dayName = daySchedule.day;
          const blocks = daySchedule.blocks || [];
          
          return {
            dayName,
            blocks
          };
        });
      } catch (e) {
        console.warn('Error processing schedule data:', e);
      }
    }
    
    // Fallback: use weeklyCycle data
    return DAY_NAMES.map((dayName, dayIndex) => {
      try {
        const scheduleData = getDaySchedule(weeklyCycle, dayIndex, heatmapData || []);
        
        // Transform old schedule format to new block format
        const blocks = scheduleData.map(item => {
          if (!item || typeof item !== 'object') {
            return null;
          }
          
          return {
            time: item.time || '',
            activity: 'Muraja\'ah',
            details: item.sipara || '',
            duration: item.duration || ''
          };
        }).filter(item => item && item.time); // Filter out items without time
        
        return {
          dayName,
          blocks
        };
      } catch (e) {
        console.warn('Error processing day schedule for', dayName, e);
        return {
          dayName,
          blocks: []
        };
      }
    });
  })();

  // Calculate dynamic scaling based on event density
  const calculateScaling = () => {
    const maxBlocks = Math.max(...allDaySchedules.map(day => day.blocks.length));
    const reservedRows = 2; // Juz Hali and Jadeed
    
    // Base font sizes for normal schedule (up to 8 events + 2 reserved = 10 rows)
    const baseFontSize = 10;
    const baseCellFontSize = 8;
    const basePadding = 4;
    const minFontSize = 7;
    const minCellFontSize = 7;
    
    // Calculate scaling factor based on event density
    // If maxBlocks + reservedRows > 10, scale down proportionally
    const totalRows = maxBlocks + reservedRows;
    const scalingFactor = totalRows > 10 ? Math.max(10 / totalRows, minFontSize / baseFontSize) : 1;
    
    const scaledFontSize = Math.max(Math.round(baseFontSize * scalingFactor), minFontSize);
    const scaledCellFontSize = Math.max(Math.round(baseCellFontSize * scalingFactor), minCellFontSize);
    const scaledPadding = Math.max(Math.round(basePadding * scalingFactor), 2);
    
    // Check if even minimum font size would overflow
    const wouldOverflow = totalRows > 12; // 12 rows is the practical limit at 7px font
    
    return {
      fontSize: scaledFontSize,
      cellFontSize: scaledCellFontSize,
      padding: scaledPadding,
      wouldOverflow,
      totalRows
    };
  };

  const scaling = calculateScaling();

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      fontSize: `${scaling.fontSize}px`,
      color: '#000000',
      backgroundColor: '#FFFFFF',
      padding: `${scaling.padding}px`,
      margin: '0 auto',
      minHeight: 'auto',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start'
    }}>
      <h1 style={{
        textAlign: 'center',
        fontSize: `${Math.round(scaling.fontSize * 1.6)}px`,
        fontWeight: 'bold',
        marginBottom: `${scaling.padding * 1.5}px`,
        paddingBottom: `${scaling.padding}px`,
        borderBottom: '2px solid #000000'
      }}>
        Hifz al-Quran Weekly Schedule
      </h1>
      
      {/* Responsive grid layout: 3 days per row for landscape, 1 column for portrait */}
      <div className="schedule-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: `${scaling.padding}px`,
        marginBottom: `${scaling.padding}px`
      }}>
        <style>{`
          @media print and (orientation: portrait) {
            .schedule-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
        {allDaySchedules.map(({ dayName, blocks }) => {
          return (
            <div key={dayName} style={{
              border: '1px solid #CCCCCC',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: '#F5F5F5',
                padding: `${scaling.padding}px`,
                borderBottom: '1px solid #CCCCCC',
                fontWeight: 'bold',
                fontSize: `${scaling.fontSize}px`,
                textAlign: 'center'
              }}>
                {dayName}
              </div>
              
              {/* Always show table with reserved rows, even if empty */}
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: `${scaling.cellFontSize}px`
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#EEEEEE',
                    borderBottom: '1px solid #000000'
                  }}>
                    <th style={{
                      padding: `${scaling.padding}px`,
                      textAlign: 'left',
                      fontWeight: 'bold',
                      border: '1px solid #CCCCCC',
                      fontSize: `${Math.max(scaling.cellFontSize - 1, 6)}px`
                    }}>Time</th>
                    <th style={{
                      padding: `${scaling.padding}px`,
                      textAlign: 'left',
                      fontWeight: 'bold',
                      border: '1px solid #CCCCCC',
                      fontSize: `${Math.max(scaling.cellFontSize - 1, 6)}px`
                    }}>Sipara</th>
                    <th style={{
                      padding: `${scaling.padding}px`,
                      textAlign: 'left',
                      fontWeight: 'bold',
                      border: '1px solid #CCCCCC',
                      fontSize: `${Math.max(scaling.cellFontSize - 1, 6)}px`
                    }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                // Safety check for blocks array
                if (!blocks || !Array.isArray(blocks)) {
                  blocks = [];
                }

                // Filter out invalid blocks first - be very strict
                const validBlocks = blocks.filter(block => {
                  if (!block) return false;
                  if (typeof block !== 'object') return false;
                  if (Array.isArray(block)) return false;
                  if (!block.time) return false;
                  if (typeof block.time !== 'string') return false;
                  if (block.time.length === 0) return false;
                  return true;
                });
                
                // Render valid blocks
                const renderedBlocks = validBlocks.map((block, index) => {
                  try {
                    const blockTime = block.time;
                    
                    if (!blockTime || typeof blockTime !== 'string') {
                      return null;
                    }
                    
                    // Try to parse time format HH:MM-HH:MM or HH:MM–HH:MM (en-dash)
                    let duration = 0;
                    
                    if (blockTime && typeof blockTime === 'string' && blockTime.length > 0) {
                      try {
                        // Handle both hyphen (-) and en-dash (–)
                        const timeParts = blockTime.split(/[-–]/);
                        if (timeParts && Array.isArray(timeParts) && timeParts.length === 2) {
                          const startTime = timeParts[0];
                          const endTime = timeParts[1];
                          
                          if (startTime && endTime && typeof startTime === 'string' && typeof endTime === 'string' && 
                              startTime.includes(':') && endTime.includes(':')) {
                            const startParts = startTime.split(':');
                            const endParts = endTime.split(':');
                            if (startParts && endParts && Array.isArray(startParts) && Array.isArray(endParts) && 
                                startParts.length === 2 && endParts.length === 2) {
                              const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
                              const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                              if (!isNaN(startMins) && !isNaN(endMins)) {
                                duration = endMins - startMins;
                              }
                            }
                          }
                        }
                      } catch (e) {
                        console.warn('Failed to parse time:', blockTime, e);
                      }
                    }
                    
                    // If duration calculation failed, try to use existing duration field
                    if (duration <= 0) {
                      try {
                        if (block.duration) {
                          if (typeof block.duration === 'string') {
                            const durationMatch = block.duration.match(/(\d+)/);
                            if (durationMatch) {
                              duration = parseInt(durationMatch[1]);
                            }
                          } else if (typeof block.duration === 'number') {
                            duration = block.duration;
                          }
                        }
                      } catch (e) {
                        console.warn('Failed to parse duration:', block.duration, e);
                      }
                    }
                    
                    // Handle both new structure (activity, details) and old structure (sipara, duration string)
                    const details = block.details || block.sipara || '';
                    
                    return (
                      <tr key={`block-${index}`} style={{
                        borderBottom: '1px solid #CCCCCC',
                        backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9F9F9'
                      }}>
                        <td style={{
                          padding: `${scaling.padding}px`,
                          border: '1px solid #CCCCCC',
                          fontWeight: '500',
                          fontSize: `${scaling.cellFontSize}px`
                        }}>
                          {blockTime}
                        </td>
                        <td style={{
                          padding: `${scaling.padding}px`,
                          border: '1px solid #CCCCCC',
                          fontSize: `${scaling.cellFontSize}px`
                        }}>
                          {details}
                        </td>
                        <td style={{
                          padding: `${scaling.padding}px`,
                          border: '1px solid #CCCCCC',
                          fontSize: `${scaling.cellFontSize}px`
                        }}>
                          {duration > 0 ? `${duration} min` : (typeof block.duration === 'string' ? block.duration : '')}
                        </td>
                      </tr>
                    );
                  } catch (e) {
                    console.warn('Error rendering block:', block, e);
                    return null;
                  }
                }).filter(Boolean);
                
                // Add reserved rows for Juz Hali and Jadeed
                const reservedRows = [
                  {
                    type: 'Juz Hali',
                    time: '',
                    details: 'Juz Hali',
                    duration: ''
                  },
                  {
                    type: 'Jadeed',
                    time: '',
                    details: 'Jadeed',
                    duration: ''
                  }
                ];
                
                const renderedReservedRows = reservedRows.map((row, index) => (
                  <tr key={`reserved-${index}`} style={{
                    borderBottom: '1px dashed #999999',
                    backgroundColor: '#FFF8E1',
                    fontStyle: 'italic'
                  }}>
                    <td style={{
                      padding: `${scaling.padding}px`,
                      border: '1px dashed #999999',
                      fontSize: `${scaling.cellFontSize}px`,
                      color: '#666666'
                    }}>
                      {row.time}
                    </td>
                    <td style={{
                      padding: `${scaling.padding}px`,
                      border: '1px dashed #999999',
                      fontSize: `${scaling.cellFontSize}px`,
                      fontWeight: '600',
                      color: '#666666'
                    }}>
                      {row.details}
                    </td>
                    <td style={{
                      padding: `${scaling.padding}px`,
                      border: '1px dashed #999999',
                      fontSize: `${scaling.cellFontSize}px`,
                      color: '#666666'
                    }}>
                      {row.duration}
                    </td>
                  </tr>
                ));
                
                return [...renderedBlocks, ...renderedReservedRows];
              })()}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div style={{
        marginTop: `${scaling.padding * 1.5}px`,
        paddingTop: `${scaling.padding}px`,
        borderTop: '1px solid #CCCCCC',
        fontSize: `${scaling.fontSize}px`,
        color: '#666666',
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        Page quality details available in Quran Map
      </div>
      
      {scaling.wouldOverflow && (
        <div style={{
          marginTop: `${scaling.padding}px`,
          padding: `${scaling.padding}px`,
          backgroundColor: '#FFF3CD',
          border: '1px solid #FFC107',
          borderRadius: '4px',
          fontSize: `${scaling.fontSize}px`,
          color: '#856404',
          textAlign: 'center'
        }}>
          ⚠️ Schedule has {scaling.totalRows} events per day. Consider reducing events or using landscape orientation for optimal printing.
        </div>
      )}
      
      <div style={{
        marginTop: `${scaling.padding}px`,
        fontSize: `${Math.max(scaling.fontSize - 1, 7)}px`,
        color: '#999999',
        textAlign: 'center'
      }}>
        Generated by Hifz al-Quran Platform
      </div>
    </div>
  );
}
