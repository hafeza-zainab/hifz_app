import React, { useState, useEffect, useRef } from 'react';
import { getHeatmapData } from '../../../shared/services/analyticsApi';
import { schedulerApi } from '../services/schedulerApi';
import html2pdf from 'html2pdf.js';
import PrintableSchedule from '../components/PrintableSchedule';

const DAYS = [
  { value: 0, label: 'S' },
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' }
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Built-in template hierarchy (from backend)
const BUILT_IN_TEMPLATES = {
  jamea: { comingSoon: true, label: 'Jamea (Coming Soon)' },
  school: {
    label: 'School',
    subcategories: {
      msb: { label: 'MSB', requiresBoardSelection: true },
      regular: { label: 'Regular School', requiresBoardSelection: true },
      college: { label: 'College', mainBlock: { name: 'Lectures', startTime: '09:00', endTime: '15:00' } }
    }
  },
  working: {
    label: 'Working',
    subcategories: {
      internship: { label: 'Internship', mainBlock: { name: 'Internship', startTime: '09:00', endTime: '17:00' } },
      job: {
        label: 'Job',
        subcategories: {
          day: { label: 'Day Shift', mainBlock: { name: 'Work', startTime: '09:00', endTime: '17:00' } },
          evening: { label: 'Evening Shift', mainBlock: { name: 'Work', startTime: '15:00', endTime: '23:00' } },
          night: { label: 'Night Shift', mainBlock: { name: 'Work', startTime: '22:00', endTime: '06:00' } }
        }
      },
      business: { label: 'Business', mainBlock: { name: 'Business', startTime: '09:00', endTime: '20:00' } }
    }
  },
  custom: { label: 'Start from Scratch', mainBlock: null }
};

// School board timings and grade bands
const SCHOOL_BOARD_TIMINGS = {
  'CBSE': [['08:30','12:30'],['08:00','14:00'],['08:00','14:30'],['08:00','15:00']],
  'CISCE / ICSE': [['08:30','12:30'],['08:00','14:00'],['08:00','14:45'],['08:00','15:00']],
  'Cambridge International (CAIE)': [['08:00','12:30'],['07:30','14:15'],['07:30','15:00'],['07:30','15:30']],
  'Pearson Edexcel': [['08:00','12:30'],['07:45','14:15'],['07:45','15:00'],['07:45','15:30']],
  'International Baccalaureate (IB)': [['08:30','12:30'],['08:00','15:00'],['08:00','15:30'],['08:00','16:00']],
  'American Curriculum': [['08:30','12:30'],['08:00','15:00'],['08:00','15:30'],['08:00','16:00']],
  'British National Curriculum (UK)': [['08:30','12:30'],['08:30','15:15'],['08:30','15:30'],['08:30','15:30']],
  'French Curriculum': [['08:30','12:00'],['08:30','15:00'],['08:30','15:30'],['08:30','16:00']],
  'German Curriculum': [['07:30','12:00'],['07:45','13:30'],['07:45','14:00'],['07:45','14:30']],
  'Australian Curriculum': [['08:30','12:30'],['08:45','15:00'],['08:45','15:15'],['08:45','15:30']],
  'New Zealand Curriculum': [['08:30','12:30'],['08:45','15:00'],['08:45','15:15'],['08:45','15:30']],
  'Singapore Curriculum (MOE)': [['07:30','11:30'],['07:30','13:30'],['07:30','14:00'],['07:30','14:30']],
  'Malaysian Curriculum (KSSR)': [['07:30','12:00'],['07:30','13:30'],['07:30','14:00'],['07:30','14:30']],
  'UAE Ministry Curriculum': [['07:30','12:00'],['07:30','13:30'],['07:30','14:00'],['07:30','14:30']],
  'Saudi National Curriculum': [['07:30','12:00'],['07:30','13:30'],['07:30','14:00'],['07:30','14:30']],
  'Pakistan National Curriculum': [['07:30','12:00'],['07:30','13:30'],['07:30','14:00'],['07:30','14:30']],
  'Bangladesh National Curriculum': [['07:30','12:00'],['07:30','13:30'],['07:30','14:00'],['07:30','14:30']],
  'Sri Lankan Curriculum': [['08:00','12:30'],['08:00','13:30'],['08:00','14:00'],['08:00','14:30']],
  'Kenyan Curriculum (CBC)': [['08:00','12:30'],['07:30','14:15'],['07:30','15:00'],['07:30','15:30']],
  'Tanzanian Curriculum': [['08:00','12:30'],['07:30','14:15'],['07:30','15:00'],['07:30','15:30']],
  'South African CAPS': [['07:30','12:00'],['07:30','13:45'],['07:30','14:30'],['07:30','15:00']],
  'Nigerian Curriculum': [['08:00','12:30'],['08:00','14:00'],['08:00','14:30'],['08:00','15:00']],
  'Chinese National Curriculum': [['08:00','11:30'],['08:00','15:00'],['08:00','15:30'],['08:00','16:00']],
  'Japanese Curriculum': [['07:30','11:30'],['08:00','14:30'],['08:30','15:00'],['08:30','15:30']],
  'South Korean Curriculum': [['07:30','11:30'],['08:00','14:30'],['08:00','15:00'],['08:00','15:30']],
  'Finnish National Curriculum': [['08:30','12:30'],['08:30','13:45'],['08:30','14:15'],['08:30','14:45']],
  'Swedish Curriculum': [['08:00','12:00'],['08:00','13:30'],['08:00','14:00'],['08:00','14:30']],
  'Norwegian Curriculum': [['08:15','12:15'],['08:15','13:45'],['08:15','14:15'],['08:15','14:45']],
  'Danish Folkeskole': [['08:00','12:00'],['08:00','13:45'],['08:00','14:15'],['08:00','14:45']],
  'Dutch Curriculum': [['08:30','12:30'],['08:30','14:00'],['08:30','14:30'],['08:30','15:00']],
  'Italian Curriculum': [['08:30','12:30'],['08:30','13:30'],['08:30','14:00'],['08:30','14:30']],
  'Spanish Curriculum': [['09:00','12:30'],['09:00','14:00'],['09:00','14:30'],['09:00','15:00']]
};

const GRADE_BANDS = ['Pre-Primary', 'Primary', 'Middle', 'Secondary'];

// Universal defaults for all templates
const UNIVERSAL_DEFAULTS = [
  { name: 'Fajr', startTime: '05:00', endTime: '05:30' },
  { name: 'Breakfast', startTime: '07:00', endTime: '07:30' },
  { name: 'Lunch', startTime: '12:30', endTime: '13:00' },
  { name: 'Zuhr & Asr', startTime: '13:00', endTime: '14:00' },
  { name: 'Maghrib & Isha', startTime: '19:00', endTime: '20:00' },
  { name: 'Dinner', startTime: '20:00', endTime: '20:30' },
  { name: 'Sleep', startTime: '22:00', endTime: '06:00' }
];

// Cumulative start page for each juz (1-indexed array, index 0 = juz 1)
const JUZZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
  202, 222, 242, 262, 282, 302, 322, 342, 362,
  382, 402, 422, 442, 462, 482, 502, 522, 542,
  562, 582
];

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

// Event type to color mapping for fixed events
const getEventColor = (title) => {
  const lowerTitle = title.toLowerCase();
  
  // Prayer events
  if (lowerTitle.includes('prayer') || lowerTitle.includes('fajr') || lowerTitle.includes('tahajjud') || 
      lowerTitle.includes('zuhr') || lowerTitle.includes('asr') || lowerTitle.includes('maghrib') || 
      lowerTitle.includes('isha')) {
    return '#2D6A4F'; // Green/Teal
  }
  
  // Meal events
  if (lowerTitle.includes('lunch') || lowerTitle.includes('dinner') || lowerTitle.includes('breakfast') || lowerTitle.includes('meal')) {
    return '#F59E0B'; // Orange/Amber
  }
  
  // Work/School events
  if (lowerTitle.includes('work') || lowerTitle.includes('school') || lowerTitle.includes('homework') || 
      lowerTitle.includes('hifz') || lowerTitle.includes('lecture') || lowerTitle.includes('internship') || 
      lowerTitle.includes('business') || lowerTitle.includes('job')) {
    return '#3B82F6'; // Blue
  }
  
  // Sleep events
  if (lowerTitle.includes('sleep')) {
    return '#6B7280'; // Gray
  }
  
  // Exercise events
  if (lowerTitle.includes('exercise') || lowerTitle.includes('gym')) {
    return '#EC4899'; // Pink
  }
  
  // Default/Personal events
  return '#9CA3AF'; // Light Gray
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

// Calculate duration for a sipara based on page scores from heatmap data
const calculateSiparaDuration = (siparaNumber, heatmapData) => {
  const pageScores = {};
  
  // Get start page for this juz
  const startPage = JUZZ_START_PAGES[siparaNumber - 1] || 1;
  console.log(`calculateSiparaDuration: Sipara ${siparaNumber}, startPage: ${startPage}`);
  
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
  
  console.log(`calculateSiparaDuration: Sipara ${siparaNumber}, pageScores:`, pageScores);
  
  const pages = Array.from({ length: 20 }, (_, i) => i + 1);
  return pages.reduce((sum, page) => {
    const score = pageScores[page];
    if (score === null || score === undefined) return sum; // Skip pages with no data
    return sum + getTimePerPage(score);
  }, 0);
};

// Get average score for a sipara from heatmap data
const getSiparaAvgScore = (siparaNumber, heatmapData) => {
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
  
  const pages = Array.from({ length: 20 }, (_, i) => i + 1);
  const pagesWithData = pages.filter(page => pageScores[page] !== null && pageScores[page] !== undefined);
  const sum = pagesWithData.reduce((sum, page) => sum + pageScores[page], 0);
  return pagesWithData.length > 0 ? sum / pagesWithData.length : 0;
};

// Helper: Parse time string "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper: Parse time string "HH:MM–HH:MM" to minutes
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.split(/[-–]/);
  if (parts.length !== 2) return null;
  
  const [start, end] = parts;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return null;
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const duration = endMinutes < startMinutes
    ? (24 * 60) - startMinutes + endMinutes  // crosses midnight
    : endMinutes - startMinutes;

  return {
    start: startMinutes,
    end: endMinutes,
    duration
  };
};

// Helper: Detect overlapping blocks and assign horizontal positions
const calculateBlockLayout = (blocks) => {
  if (!blocks || blocks.length === 0) return [];
  
  const sortedBlocks = [...blocks].sort((a, b) => {
    const timeA = parseTimeToMinutes(a.time);
    const timeB = parseTimeToMinutes(b.time);
    if (!timeA || !timeB) return 0;
    return timeA.start - timeB.start;
  });
  
  // Find all overlapping groups and assign columns within each group
  const layoutBlocks = sortedBlocks.map((block, index) => {
    const time = parseTimeToMinutes(block.time);
    if (!time) return { ...block, column: 0, totalColumns: 1 };
    
    // Find all blocks that overlap with this block
    const overlappingBlocks = sortedBlocks.filter((other, otherIndex) => {
      if (index === otherIndex) return true;
      const otherTime = parseTimeToMinutes(other.time);
      if (!otherTime) return false;
      
      // Check if blocks overlap (not just adjacent)
      return time.start < otherTime.end && time.end > otherTime.start;
    });
    
    // Total columns = number of overlapping blocks
    const totalColumns = overlappingBlocks.length;
    
    // Find column index by sorting overlapping blocks by start time
    const column = overlappingBlocks
      .sort((a, b) => {
        const timeA = parseTimeToMinutes(a.time);
        const timeB = parseTimeToMinutes(b.time);
        if (!timeA || !timeB) return 0;
        return timeA.start - timeB.start;
      })
      .indexOf(block);
    
    return {
      ...block,
      column: column >= 0 ? column : 0,
      totalColumns: totalColumns > 0 ? totalColumns : 1
    };
  });
  
  return layoutBlocks;
};

// Week Grid View Component
const WeekGridView = ({ weeklyCycle, heatmapData, events, onSelectUnit, onEmptySlotClick, onOccupiedSlotClick, isSlotOccupied, onEventDrop, onFixedEventClick, previewEvents, previewMode }) => {
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [draggedEvent, setDraggedEvent] = useState(null);
  
  console.log('WeekGridView - weeklyCycle:', weeklyCycle);
  console.log('WeekGridView - heatmapData:', heatmapData);
  console.log('WeekGridView - events:', events);
  console.log('WeekGridView - sample day item (key "0"):', weeklyCycle['0']);
  console.log('WeekGridView - weeklyCycle keys:', Object.keys(weeklyCycle));
  console.log('WeekGridView - weeklyCycle isArray:', Array.isArray(weeklyCycle));
  
  // Log the day mapping to debug off-by-one issue
  Object.keys(weeklyCycle).forEach(key => {
    console.log(`WeekGridView - Key "${key}" content:`, weeklyCycle[key]);
  });
  
  // Get all blocks for all days
  const getAllDayBlocks = () => {
    const allBlocks = {};
    
    // Use preview events if in preview mode, otherwise use existing events
    const eventsToUse = previewMode && previewEvents ? previewEvents : events;
    
    DAY_NAMES.forEach((dayName, dayIndex) => {
      let daySchedule = [];
      let dayData = null;
      
      // Handle array format (same logic as getDaySchedule)
      if (Array.isArray(weeklyCycle)) {
        dayData = weeklyCycle.find(d => d.day === dayIndex);
        console.log(`WeekGridView - Day ${dayIndex} (${dayName}) - array lookup dayData:`, dayData);
      }
      
      // Handle object format with numeric string keys ('0', '1', etc.) - fallback
      if (!dayData && typeof weeklyCycle === 'object') {
        const dayKey = String(dayIndex);
        dayData = weeklyCycle[dayKey];
        console.log(`WeekGridView - Day ${dayIndex} (${dayName}) - object lookup dayData:`, dayData);
      }
      
      // Add revision blocks from weeklyCycle
      if (dayData && dayData.siparas) {
        console.log(`WeekGridView - Day ${dayIndex} - siparas:`, dayData.siparas);
        daySchedule = dayData.siparas.map((sipara, index) => {
            const siparaNumber = typeof sipara === 'number' 
              ? sipara 
              : typeof sipara === 'object' 
                ? sipara.number 
                : parseInt(sipara?.toString().replace(/\D/g, '') || '0');
            
            // Skip Sipara 0 (Rest day) - don't render as a block
            if (siparaNumber === 0) {
              console.log(`WeekGridView - Skipping Sipara 0 (Rest day) for ${dayName}`);
              return null;
            }
            
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
              avgScore,
              type: 'revision'
            };
          }).filter(block => block !== null); // Filter out null (Sipara 0/Rest day)
      }
      
      // Add fixed events from events prop (prayers, meals, sleep, etc.)
      if (eventsToUse && Array.isArray(eventsToUse)) {
        const dayFixedEvents = eventsToUse.filter(event => {
          // Check if event applies to this day
          const eventDays = event.daysOfWeek || [];
          return eventDays.includes(dayIndex);
        });
        
        console.log(`WeekGridView - Day ${dayIndex} - fixed events:`, dayFixedEvents);
        
        const fixedEventBlocks = dayFixedEvents.map(event => {
          const startMinutes = timeToMinutes(event.startTime);
          const endMinutes = timeToMinutes(event.endTime);
          const duration = endMinutes < startMinutes
            ? (24 * 60) - startMinutes + endMinutes  // crosses midnight
            : endMinutes - startMinutes;
          
          return {
            time: `${event.startTime}–${event.endTime}`,
            sipara: event.title,
            pages: '',
            duration: `${duration} min`,
            method: 'Fixed Event',
            quality: 'Fixed',
            avgScore: null,
            type: 'fixed',
            event: event // Store full event data for drag-and-drop
          };
        });
        
        daySchedule = [...daySchedule, ...fixedEventBlocks];
      }
      
      allBlocks[dayIndex] = calculateBlockLayout(daySchedule);
    });
    
    console.log('WeekGridView - allDayBlocks:', allBlocks);
    return allBlocks;
  };
  
  const allDayBlocks = getAllDayBlocks();
  
  // Calculate time range
  const getTimeRange = () => {
    let minStart = Infinity;
    let maxEnd = -Infinity;
    
    Object.values(allDayBlocks).forEach(blocks => {
      blocks.forEach(block => {
        const time = parseTimeToMinutes(block.time);
        if (time) {
          // For midnight crossover events, normalize end time to next day
          // e.g., 22:00-06:00 becomes start=1320, end=360+1440=1800
          const normalizedEnd = time.end < time.start ? time.end + (24 * 60) : time.end;
          const normalizedStart = time.start;
          
          minStart = Math.min(minStart, normalizedStart);
          maxEnd = Math.max(maxEnd, normalizedEnd);
        }
      });
    });
    
    if (minStart === Infinity) {
      minStart = 5 * 60; // 5:00 AM default
      maxEnd = 22 * 60; // 10:00 PM default
    }
    
    return {
      start: Math.floor(minStart / 60),
      end: Math.ceil(maxEnd / 60)
    };
  };
  
  const timeRange = getTimeRange();
  const hourLabels = [];
  for (let h = timeRange.start; h <= timeRange.end; h++) {
    hourLabels.push(h);
  }
  
  const handleBlockClick = (block) => {
    if (block.type === 'revision') {
      onSelectUnit(block);
    } else if (block.type === 'fixed' && block.event) {
      // Call parent callback to open edit form
      onFixedEventClick(block.event);
    }
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '700px' }}>
      {/* Header row with day names */}
      <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>
        <div></div>
        {DAY_NAMES.map((dayName, index) => (
          <div key={dayName} style={{ textAlign: 'center', fontWeight: 600, fontSize: 13, color: '#374151' }}>
            {dayName.substring(0, 3)}
          </div>
        ))}
      </div>
      
      {/* Grid content */}
      <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', flex: 1, position: 'relative' }}>
        {/* Time labels column */}
        <div style={{ borderRight: '1px solid #E5E7EB' }}>
          {hourLabels.map(hour => (
            <div key={hour} style={{ 
              height: '70px', 
              borderBottom: '1px solid #F3F4F6',
              fontSize: 11,
              color: '#6B7280',
              textAlign: 'right',
              paddingRight: 8,
              paddingTop: 2
            }}>
              {hour % 12 || 12}{hour < 12 ? 'am' : 'pm'}
            </div>
          ))}
        </div>
        
        {/* Day columns */}
        {DAY_NAMES.map((dayName, dayIndex) => (
          <div key={dayName} data-tour="week-view-grid" style={{ borderRight: dayIndex < 6 ? '1px solid #E5E7EB' : 'none', position: 'relative' }}>
            {/* Hour grid lines with click handlers */}
            {hourLabels.map(hour => (
              <div 
                key={hour} 
                onDragOver={(e) => {
                  if (draggedEvent) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }
                }}
                onDrop={(e) => {
                  if (draggedEvent && onEventDrop) {
                    e.preventDefault();
                    // Calculate new start time from hour
                    const newStartTime = `${String(hour).padStart(2, '0')}:00`;
                    // Calculate duration from original event
                    const startMinutes = timeToMinutes(draggedEvent.startTime);
                    const endMinutes = timeToMinutes(draggedEvent.endTime);
                    const duration = endMinutes < startMinutes
                      ? (24 * 60) - startMinutes + endMinutes
                      : endMinutes - startMinutes;
                    
                    // Calculate new end time
                    const newEndMinutes = (hour * 60) + duration;
                    const newEndHour = Math.floor(newEndMinutes / 60) % 24;
                    const newEndMin = newEndMinutes % 60;
                    const newEndTime = `${String(newEndHour).padStart(2, '0')}:${String(newEndMin).padStart(2, '0')}`;
                    
                    // Update daysOfWeek to include the new day
                    const newDaysOfWeek = draggedEvent.daysOfWeek.includes(dayIndex)
                      ? draggedEvent.daysOfWeek
                      : [...draggedEvent.daysOfWeek, dayIndex].sort((a, b) => a - b);
                    
                    onEventDrop(draggedEvent.id, {
                      startTime: newStartTime,
                      endTime: newEndTime,
                      daysOfWeek: newDaysOfWeek
                    });
                  }
                }}
                style={{ 
                  height: '70px', 
                  borderBottom: '1px solid #F3F4F6',
                  cursor: isSlotOccupied && isSlotOccupied(dayIndex, hour) ? 'pointer' : 'pointer',
                  backgroundColor: isSlotOccupied && isSlotOccupied(dayIndex, hour) ? 'transparent' : '#F9FAFB',
                  border: draggedEvent ? '2px dashed #3B82F6' : 'none'
                }}
                onClick={() => {
                  if (isSlotOccupied && isSlotOccupied(dayIndex, hour)) {
                    onOccupiedSlotClick(dayIndex, hour);
                  } else {
                    onEmptySlotClick(dayIndex, hour);
                  }
                }}
              />
            ))}
            
            {/* Blocks */}
            {allDayBlocks[dayIndex]?.map((block, blockIndex) => {
              const time = parseTimeToMinutes(block.time);
              if (!time) return null;
              
              const top = (time.start - (timeRange.start * 60)) * 1.17; // 1.17px per minute (70px / 60min)
              const height = time.duration * 1.17;
              const left = (block.column / block.totalColumns) * 100;
              const width = (1 / block.totalColumns) * 100;
              
              console.log(`WeekGridView - Rendering block for ${dayName}:`, {
                block,
                time,
                top,
                height,
                left,
                width,
                column: block.column,
                totalColumns: block.totalColumns
              });
              
              return (
                <div
                  key={blockIndex}
                  draggable={block.type === 'fixed' && block.event}
                  onDragStart={(e) => {
                    if (block.type === 'fixed' && block.event) {
                      setDraggedEvent(block.event);
                      e.dataTransfer.effectAllowed = 'move';
                    }
                  }}
                  onDragEnd={() => setDraggedEvent(null)}
                  onClick={() => handleBlockClick(block)}
                  style={{
                    position: 'absolute',
                    top: `${top}px`,
                    left: `${left}%`,
                    width: `${width - 0.5}%`,
                    height: `${height}px`,
                    backgroundColor: block.type === 'fixed' ? getEventColor(block.sipara) : getScoreColor(block.avgScore),
                    borderRadius: 6,
                    padding: 8,
                    fontSize: 12,
                    color: block.type === 'fixed' ? '#fff' : (block.avgScore >= 5 && block.avgScore < 7 ? '#000' : '#fff'),
                    cursor: block.type === 'fixed' && block.event ? 'move' : (block.type === 'revision' ? 'pointer' : 'default'),
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    border: 'none',
                    opacity: draggedEvent && draggedEvent.id === block.event?.id ? 0.5 : 1,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                  title={`${block.sipara} - ${block.time}`}
                >
                  <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                    {block.sipara}
                  </div>
                  {block.time && (
                    <div style={{ fontSize: 11, opacity: 0.9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                      {block.time}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function GeneratedSchedule({ schedule, weeklyCycle, events, exceptions, onEventsChange, onExceptionsChange, onSelectUnit, onBack }) {
  const [selectedDay, setSelectedDay] = useState(1); // Default to Monday
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'week'
  const [heatmapData, setHeatmapData] = useState([]);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  
  // Template selection state
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templatePath, setTemplatePath] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedGradeBand, setSelectedGradeBand] = useState('');
  const [selectedDaysForTemplate, setSelectedDaysForTemplate] = useState([1, 2, 3, 4, 5]);
  
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [addEventSlot, setAddEventSlot] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [previewEvents, setPreviewEvents] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    daysOfWeek: [1, 2, 3, 4, 5],
    isFixed: true,
    isOneTime: false,
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getHeatmapData();
        if (res.success) {
          setHeatmapData(res.data || []);
          console.log('GeneratedSchedule: Loaded heatmap data:', res.data?.length || 0, 'entries');
          console.log('GeneratedSchedule: Sample heatmap entry:', res.data?.[0]);
        }
      } catch (err) {
        console.error('GeneratedSchedule: Failed to fetch heatmap data:', err);
      }
    };
    fetchData();
  }, []);

  console.log('GeneratedSchedule schedule:', schedule);
  console.log('GeneratedSchedule weeklyCycle:', weeklyCycle);

  // Get schedule for selected day from weekly cycle data
  const getDaySchedule = () => {
    console.log('getDaySchedule called with weeklyCycle:', weeklyCycle);
    console.log('getDaySchedule selectedDay:', selectedDay);
    
    if (!weeklyCycle) {
      console.log('No weeklyCycle data available');
      return [];
    }
    
    // Handle array format
    if (Array.isArray(weeklyCycle)) {
      console.log('weeklyCycle is array, finding day:', selectedDay);
      const dayData = weeklyCycle.find(d => d.day === selectedDay);
      console.log('Found dayData:', dayData);
      if (dayData && dayData.siparas) {
        return dayData.siparas.map((sipara, index) => {
          // Parse sipara number from string (e.g., "Sipara Sipara 2 (Very Good)" -> 2)
          const siparaNumber = typeof sipara === 'number' 
            ? sipara 
            : typeof sipara === 'object' 
              ? sipara.number 
              : parseInt(sipara?.toString().replace(/\D/g, '') || '0');
          console.log(`GeneratedSchedule: Raw sipara value:`, sipara, `type:`, typeof sipara);
          console.log(`GeneratedSchedule: Parsed siparaNumber:`, siparaNumber, `type:`, typeof siparaNumber);
          const avgScore = getSiparaAvgScore(siparaNumber, heatmapData);
          const duration = calculateSiparaDuration(siparaNumber, heatmapData);
          const quality = getScoreLabel(avgScore);
          
          console.log(`GeneratedSchedule: Sipara ${siparaNumber} - avgScore: ${avgScore.toFixed(1)}, duration: ${duration}min, quality: ${quality}`);
          
          // Calculate start time based on cumulative duration
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
            color: avgScore >= 7 ? 'green' : avgScore >= 5 ? 'yellow' : avgScore >= 3 ? 'orange' : 'red',
            avgScore,
            type: 'revision'
          };
        });
      }
    }
    
    // Handle object format with numeric string keys ('0', '1', etc.)
    if (typeof weeklyCycle === 'object') {
      console.log('weeklyCycle is object, keys:', Object.keys(weeklyCycle));
      console.log('Looking for key:', String(selectedDay));
      
      // Try direct lookup with string key first
      const dayKey = String(selectedDay);
      console.log('Trying direct lookup with key:', dayKey);
      
      if (weeklyCycle[dayKey]?.siparas) {
        console.log('Found data with key:', dayKey);
        return weeklyCycle[dayKey].siparas.map((sipara, index) => {
          // Parse sipara number from string (e.g., "Sipara Sipara 2 (Very Good)" -> 2)
          const siparaNumber = typeof sipara === 'number' 
            ? sipara 
            : typeof sipara === 'object' 
              ? sipara.number 
              : parseInt(sipara?.toString().replace(/\D/g, '') || '0');
          const avgScore = getSiparaAvgScore(siparaNumber, heatmapData);
          const duration = calculateSiparaDuration(siparaNumber, heatmapData);
          const quality = getScoreLabel(avgScore);
          
          console.log(`GeneratedSchedule: Sipara ${siparaNumber} - avgScore: ${avgScore.toFixed(1)}, duration: ${duration}min, quality: ${quality}`);
          
          // Calculate start time based on cumulative duration
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
            color: avgScore >= 7 ? 'green' : avgScore >= 5 ? 'yellow' : avgScore >= 3 ? 'orange' : 'red',
            avgScore,
            type: 'revision'
          };
        });
      }
      
      // Fallback: try to find by day name
      const dayNameKey = Object.keys(weeklyCycle).find(key => 
        key.toLowerCase().includes(DAY_NAMES[selectedDay].toLowerCase())
      );
      console.log('Fallback: Found dayNameKey:', dayNameKey);
      if (dayNameKey && weeklyCycle[dayNameKey]?.siparas) {
        return weeklyCycle[dayNameKey].siparas.map((sipara, index) => {
          // Parse sipara number from string (e.g., "Sipara Sipara 2 (Very Good)" -> 2)
          const siparaNumber = typeof sipara === 'number' 
            ? sipara 
            : typeof sipara === 'object' 
              ? sipara.number 
              : parseInt(sipara?.toString().replace(/\D/g, '') || '0');
          const avgScore = getSiparaAvgScore(siparaNumber, heatmapData);
          const duration = calculateSiparaDuration(siparaNumber, heatmapData);
          const quality = getScoreLabel(avgScore);
          
          console.log(`GeneratedSchedule: Sipara ${siparaNumber} - avgScore: ${avgScore.toFixed(1)}, duration: ${duration}min, quality: ${quality}`);
          
          // Calculate start time based on cumulative duration
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
            color: avgScore >= 7 ? 'green' : avgScore >= 5 ? 'yellow' : avgScore >= 3 ? 'orange' : 'red',
            avgScore,
            type: 'revision'
          };
        });
      }
    }
    
    console.log('No matching schedule found, returning empty array');
    return [];
  };

  const [daySchedule, setDaySchedule] = useState([]);
  
  // Recalculate schedule when heatmap data loads or weeklyCycle changes
  useEffect(() => {
    console.log('GeneratedSchedule: Triggering schedule recalculation');
    console.log('GeneratedSchedule: heatmapData length:', heatmapData.length);
    console.log('GeneratedSchedule: weeklyCycle available:', !!weeklyCycle);
    
    // Generate schedule from weeklyCycle even if schedule prop is undefined
    if (weeklyCycle) {
      const generatedSchedule = getDaySchedule();
      console.log('GeneratedSchedule: Generated schedule for day:', selectedDay, 'with', generatedSchedule.length, 'items');
      setDaySchedule(generatedSchedule);
    } else if (schedule && Array.isArray(schedule)) {
      // Fallback to schedule prop if weeklyCycle is not available
      console.log('GeneratedSchedule: Using schedule prop as fallback');
      setDaySchedule(schedule);
    }
  }, [heatmapData, weeklyCycle, selectedDay, schedule]);

  const handlePrint = () => {
    setShowPrintMenu(false);
    // Temporarily show the printable schedule for printing
    const printableContainer = document.querySelector('.printable-schedule-container');
    if (printableContainer) {
      printableContainer.style.display = 'block';
      window.print();
      // Hide it again after print dialog closes
      setTimeout(() => {
        printableContainer.style.display = 'none';
      }, 100);
    }
  };

  const handleDownloadPDF = () => {
    setShowPrintMenu(false);
    if (printRef.current) {
      const element = printRef.current;
      const opt = {
        margin: 10,
        filename: 'hifz-schedule.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'landscape'
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      html2pdf().set(opt).from(element).save();
    }
  };

  // Helper: Parse time string "HH:MM" to minutes from midnight
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper: Check if two events overlap
  const eventsOverlap = (event1, event2) => {
    const start1 = timeToMinutes(event1.startTime);
    const end1 = timeToMinutes(event1.endTime);
    const start2 = timeToMinutes(event2.startTime);
    const end2 = timeToMinutes(event2.endTime);
    
    const sharedDays = event1.daysOfWeek.some(day => event2.daysOfWeek.includes(day));
    if (!sharedDays) return false;
    
    return start1 < end2 && end1 > start2;
  };

  // Helper: Merge daysOfWeek arrays with deduplication and sorting
  const mergeDaysOfWeek = (existingDays, newDays) => {
    const merged = new Set([...(existingDays || []), ...(newDays || [])]);
    return Array.from(merged).sort((a, b) => a - b);
  };

  // Helper: Filter out Sunday (0) from daysOfWeek if not explicitly selected
  const filterSundayIfNeeded = (days, selectedDays) => {
    if (!selectedDays.includes(0) && days.includes(0)) {
      return days.filter(d => d !== 0);
    }
    return days;
  };

  // Template navigation functions
  const navigateToTemplate = (key, isLeaf = false) => {
    const newPath = [...templatePath, key];
    setTemplatePath(newPath);
    
    if (isLeaf) {
      // Resolve template to events and apply
      resolveTemplateToEvents(newPath);
    }
  };

  const navigateBack = () => {
    if (templatePath.length > 0) {
      const newPath = templatePath.slice(0, -1);
      setTemplatePath(newPath);
      // Reset board/grade selection if going back from school subcategory
      if (newPath.length === 1 && (newPath[0] === 'msb' || newPath[0] === 'regular')) {
        setSelectedBoard('');
        setSelectedGradeBand('');
      }
    } else {
      setShowTemplatePicker(false);
    }
    // Reset day selection when navigating back
    setSelectedDaysForTemplate([1, 2, 3, 4, 5]);
  };

  const resolveTemplateToEvents = (path) => {
    // Get current node in hierarchy
    let current = BUILT_IN_TEMPLATES;
    let mainBlock = null;
    
    for (const key of path) {
      if (!current) break;
      if (current[key]) {
        if (current[key].mainBlock !== undefined) {
          mainBlock = current[key].mainBlock;
        }
        if (current[key].subcategories) {
          current = current[key].subcategories;
        } else {
          break;
        }
      }
    }

    const events = [...UNIVERSAL_DEFAULTS];
    
    // If board and grade are selected, add School block with looked-up timing
    if (selectedBoard && selectedGradeBand) {
      const gradeIndex = GRADE_BANDS.indexOf(selectedGradeBand);
      if (gradeIndex >= 0 && SCHOOL_BOARD_TIMINGS[selectedBoard]) {
        const timing = SCHOOL_BOARD_TIMINGS[selectedBoard][gradeIndex];
        events.push({ name: 'School', startTime: timing[0], endTime: timing[1] });
      }
    }
    
    if (mainBlock) {
      events.push(mainBlock);
    }

    // Apply the template
    applyTemplateEvents(events);
  };

  const getCurrentTemplateNode = () => {
    let current = BUILT_IN_TEMPLATES;
    for (const key of templatePath) {
      if (!current) return null;
      if (current[key]) {
        if (current[key].subcategories) {
          current = current[key].subcategories;
        } else {
          return current[key];
        }
      }
    }
    return current;
  };

  // Apply template events with sourceTemplate tagging
  const applyTemplateEvents = async (templateEvents, previewOnly = false) => {
    setLoading(true);
    const conflicts = [];
    const eventsToApply = [];

    // If not preview mode, delete existing events from previous template
    if (!previewOnly) {
      const previousTemplateEvents = events.filter(e => e.sourceTemplate);
      for (const event of previousTemplateEvents) {
        if (event.id) {
          await schedulerApi.deleteEvent(event.id);
        }
      }
    }

    // Check for conflicts with manually-added events
    templateEvents.forEach(templateEvent => {
      const existingEvent = events.find(e => 
        e.title === templateEvent.name && 
        e.startTime === templateEvent.startTime &&
        e.endTime === templateEvent.endTime &&
        !e.sourceTemplate // Only check manually-added events
      );

      if (existingEvent) {
        // Merge daysOfWeek and filter out Sunday if not selected
        const mergedDays = mergeDaysOfWeek(existingEvent.daysOfWeek, selectedDaysForTemplate);
        const filteredDays = filterSundayIfNeeded(mergedDays, selectedDaysForTemplate);
        eventsToApply.push({
          ...existingEvent,
          daysOfWeek: filteredDays,
          id: existingEvent.id // Keep existing ID for updates
        });
      } else {
        // Check for overlap with existing manually-added events
        const overlappingEvent = events.find(e => 
          !e.sourceTemplate && eventsOverlap(e, { ...templateEvent, daysOfWeek: selectedDaysForTemplate })
        );
        if (overlappingEvent) {
          conflicts.push({
            template: templateEvent,
            existing: overlappingEvent
          });
        } else {
          eventsToApply.push({
            title: templateEvent.name,
            startTime: templateEvent.startTime,
            endTime: templateEvent.endTime,
            daysOfWeek: selectedDaysForTemplate,
            isFixed: true,
            priority: 'medium',
            sourceTemplate: templatePath.join('/'),
            id: previewOnly ? `preview_${templateEvent.name}_${templateEvent.startTime}` : undefined // Temporary ID for preview
          });
        }
      }
    });

    if (conflicts.length > 0) {
      console.log('Template conflicts detected, skipping:', conflicts);
      if (previewOnly) {
        alert(`Conflicts detected with ${conflicts.length} existing events. Please resolve conflicts manually.`);
        setLoading(false);
        return;
      }
    }

    // If preview mode, show preview instead of applying
    if (previewOnly) {
      setPreviewEvents(eventsToApply);
      setPreviewMode(true);
      setLoading(false);
      return;
    }

    // Create new events
    for (const event of eventsToApply) {
      console.log('Creating event:', event);
      try {
        await schedulerApi.createEvent({
          ...event,
          daysOfWeek: event.daysOfWeek.sort((a, b) => a - b)
        });
      } catch (error) {
        console.error('Failed to create event:', error);
        console.error('Event data:', event);
        throw error;
      }
    }

    // Reload events
    await onEventsChange();
    setLoading(false);
    setShowTemplatePicker(false);
    setTemplatePath([]);
    setSelectedBoard('');
    setSelectedGradeBand('');
    setSelectedDaysForTemplate([1, 2, 3, 4, 5]);
  };

  // Handle fixed event click to open edit form
  const handleFixedEventClick = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      daysOfWeek: event.daysOfWeek || [1, 2, 3, 4, 5],
      isFixed: event.isFixed !== false,
      isOneTime: event.isOneTime || false
    });
    setShowAddEventForm(true);
  };

  // Reset events to template defaults
  const handleResetToTemplate = async () => {
    setLoading(true);
    try {
      // Find template-sourced events
      const templateKeys = new Set(events.filter(e => e.sourceTemplate).map(e => e.sourceTemplate));
      
      if (templateKeys.size === 0) {
        alert('No template-sourced events found to reset.');
        setLoading(false);
        return;
      }

      // For each template, delete and recreate events
      for (const templateKey of templateKeys) {
        const templateEvents = events.filter(e => e.sourceTemplate === templateKey);
        
        // Delete existing template events
        for (const event of templateEvents) {
          if (event.id) {
            await schedulerApi.deleteEvent(event.id);
          }
        }
      }

      // Reload events
      await onEventsChange();
      setLoading(false);
    } catch (error) {
      console.error('Failed to reset events:', error);
      setLoading(false);
      alert('Failed to reset events. Please try again.');
    }
  };

  // Clear all events
  const handleClearAllEvents = async () => {
    setLoading(true);
    try {
      // Delete all events
      for (const event of events) {
        if (event.id) {
          await schedulerApi.deleteEvent(event.id);
        }
      }

      // Reload events
      await onEventsChange();
      setLoading(false);
    } catch (error) {
      console.error('Failed to clear events:', error);
      setLoading(false);
      alert('Failed to clear events. Please try again.');
    }
  };

  // Apply preview events to backend
  const handleApplyPreviewEvents = async () => {
    if (!previewEvents || previewEvents.length === 0) return;

    setLoading(true);
    try {
      for (const event of previewEvents) {
        if (event.id && event.id.toString().startsWith('preview_')) {
          // New event - create it
          await schedulerApi.createEvent({
            ...event,
            daysOfWeek: event.daysOfWeek.sort((a, b) => a - b)
          });
        } else if (event.id) {
          // Existing event - update it
          await schedulerApi.updateEvent(event.id, {
            ...event,
            daysOfWeek: event.daysOfWeek.sort((a, b) => a - b)
          });
        }
      }

      // Reload events
      await onEventsChange();
      setLoading(false);
      setPreviewMode(false);
      setPreviewEvents(null);
      setShowTemplatePicker(false);
      setTemplatePath([]);
      setSelectedBoard('');
      setSelectedGradeBand('');
      setSelectedDaysForTemplate([1, 2, 3, 4, 5]);
    } catch (error) {
      console.error('Failed to apply preview events:', error);
      setLoading(false);
      alert('Failed to apply events. Please try again.');
    }
  };

  // Cancel preview
  const handleCancelPreview = () => {
    setPreviewMode(false);
    setPreviewEvents(null);
  };
  const saveEvent = async () => {
    if (!formData.title || !formData.startTime || !formData.endTime) {
      return;
    }

    try {
      setLoading(true);
      
      if (editingEvent) {
        // Update existing event
        await schedulerApi.updateEvent(editingEvent.id, {
          ...formData,
          daysOfWeek: formData.daysOfWeek.sort((a, b) => a - b)
        });
      } else {
        // Create new event
        await schedulerApi.createEvent({
          ...formData,
          daysOfWeek: formData.daysOfWeek.sort((a, b) => a - b)
        });
      }
      
      await onEventsChange();
      setLoading(false);
      setShowAddEventForm(false);
      setAddEventSlot(null);
      setEditingEvent(null);
      setFormData({
        title: '',
        startTime: '',
        endTime: '',
        daysOfWeek: [1, 2, 3, 4, 5],
        isFixed: true,
        isOneTime: false,
        priority: 'medium'
      });
    } catch (error) {
      console.error('Failed to save event:', error);
      setLoading(false);
    }
  };

  // Handle event drop from drag-and-drop
  const handleEventDrop = async (eventId, updates) => {
    try {
      setLoading(true);
      await schedulerApi.updateEvent(eventId, updates);
      await onEventsChange();
    } catch (error) {
      console.error('Failed to update event via drag-and-drop:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete event
  const deleteEvent = async (eventId) => {
    try {
      setLoading(true);
      await schedulerApi.deleteEvent(eventId);
      await onEventsChange();
      setLoading(false);
    } catch (error) {
      console.error('Failed to delete event:', error);
      setLoading(false);
    }
  };

  // Handle empty slot click for adding new event
  const handleEmptySlotClick = (dayIndex, hour) => {
    setEditingEvent(null);
    setAddEventSlot({ dayIndex, hour });
    setFormData({
      title: '',
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
      daysOfWeek: [dayIndex],
      isFixed: true,
      isOneTime: false,
      priority: 'medium'
    });
    setShowAddEventForm(true);
  };

  // Handle occupied slot click for editing existing event
  const handleOccupiedSlotClick = (dayIndex, hour) => {
    // Find the event at this slot
    const dayEvents = events.filter(e => e.daysOfWeek && e.daysOfWeek.includes(dayIndex));
    const eventToEdit = dayEvents.find(e => {
      const startHour = parseInt(e.startTime.split(':')[0]);
      const endHour = parseInt(e.endTime.split(':')[0]);
      return hour >= startHour && hour < endHour;
    });

    if (eventToEdit) {
      setEditingEvent(eventToEdit);
      setAddEventSlot({ dayIndex, hour });
      setFormData({
        title: eventToEdit.title,
        startTime: eventToEdit.startTime,
        endTime: eventToEdit.endTime,
        daysOfWeek: eventToEdit.daysOfWeek || [dayIndex],
        isFixed: eventToEdit.isFixed !== undefined ? eventToEdit.isFixed : true,
        isOneTime: eventToEdit.isOneTime || false,
        priority: eventToEdit.priority || 'medium'
      });
      setShowAddEventForm(true);
    }
  };

  // Check if slot is occupied
  const isSlotOccupied = (dayIndex, hour) => {
    const dayEvents = events.filter(e => e.daysOfWeek && e.daysOfWeek.includes(dayIndex));
    return dayEvents.some(e => {
      const startHour = parseInt(e.startTime.split(':')[0]);
      const endHour = parseInt(e.endTime.split(':')[0]);
      return hour >= startHour && hour < endHour;
    });
  };

  return (
    <div className="generated-schedule">
      <div className="banner success">
        <div className="banner-icon">✨</div>
        <div className="banner-text">Your personalized schedule is ready!</div>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
      </div>

      {/* Template Picker Modal */}
      {showTemplatePicker && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 24,
            maxWidth: 600,
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Select Template</h3>
              <button onClick={() => setShowTemplatePicker(false)} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ marginBottom: 16, fontSize: 13, color: '#6B7280' }}>
              {templatePath.length === 0 ? 'Templates' : templatePath.map((key, index) => (
                <span key={key}>
                  {index > 0 && ' > '}
                  {key}
                </span>
              ))}
            </div>

            {templatePath.length > 0 && (
              <button 
                onClick={navigateBack}
                style={{ marginBottom: 12, padding: '6px 12px', cursor: 'pointer' }}
              >
                ← Back
              </button>
            )}

            {(() => {
              const currentNode = getCurrentTemplateNode();
              if (!currentNode) return null;

              if (templatePath.length === 0) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {Object.entries(BUILT_IN_TEMPLATES).map(([key, value]) => (
                      <div key={key}>
                        {value.comingSoon ? (
                          <div style={{ padding: 12, backgroundColor: '#F3F4F6', borderRadius: 6, color: '#9CA3AF' }}>
                            {value.label}
                          </div>
                        ) : (
                          <button
                            onClick={() => navigateToTemplate(key)}
                            style={{
                              width: '100%',
                              padding: 12,
                              backgroundColor: '#F9FAFB',
                              border: '1px solid #D1D5DB',
                              borderRadius: 6,
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            {value.label}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              } else {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(templatePath[0] === 'msb' || templatePath[0] === 'regular') && !selectedBoard && (
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Select School Board:</label>
                        <select 
                          value={selectedBoard}
                          onChange={(e) => setSelectedBoard(e.target.value)}
                          style={{ width: '100%', padding: 8, marginBottom: 12 }}
                        >
                          <option value="">Select Board</option>
                          {Object.keys(SCHOOL_BOARD_TIMINGS).map(board => (
                            <option key={board} value={board}>{board}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedBoard && (templatePath[0] === 'msb' || templatePath[0] === 'regular') && !selectedGradeBand && (
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Select Grade Band:</label>
                        <select 
                          value={selectedGradeBand}
                          onChange={(e) => setSelectedGradeBand(e.target.value)}
                          style={{ width: '100%', padding: 8, marginBottom: 12 }}
                        >
                          <option value="">Select Grade</option>
                          {GRADE_BANDS.map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {(!selectedBoard || selectedGradeBand) && Object.entries(currentNode).map(([key, value]) => (
                      <div key={key}>
                        {value.comingSoon ? (
                          <div style={{ padding: 12, backgroundColor: '#F3F4F6', borderRadius: 6, color: '#9CA3AF' }}>
                            {value.label}
                          </div>
                        ) : value.subcategories ? (
                          <button
                            onClick={() => navigateToTemplate(key)}
                            style={{
                              width: '100%',
                              padding: 12,
                              backgroundColor: '#F9FAFB',
                              border: '1px solid #D1D5DB',
                              borderRadius: 6,
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            {value.label} →
                          </button>
                        ) : (
                          <button
                            onClick={() => navigateToTemplate(key, true)}
                            style={{
                              width: '100%',
                              padding: 12,
                              backgroundColor: '#E0F2FE',
                              border: '1px solid #0EA5E9',
                              borderRadius: 6,
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontWeight: 600
                            }}
                          >
                            {value.label} ✓
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              }
            })()}

            {templatePath.length > 0 && getCurrentTemplateNode() && !getCurrentTemplateNode().subcategories && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Apply to days:</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {DAYS.map(day => (
                    <label key={day.value} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input 
                        type="checkbox"
                        checked={selectedDaysForTemplate.includes(day.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDaysForTemplate([...selectedDaysForTemplate, day.value]);
                          } else {
                            setSelectedDaysForTemplate(selectedDaysForTemplate.filter(d => d !== day.value));
                          }
                        }}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      const events = [...UNIVERSAL_DEFAULTS];
                      let mainBlock = null;
                      let current = BUILT_IN_TEMPLATES;
                      
                      for (const key of templatePath) {
                        if (!current) break;
                        if (current[key]) {
                          if (current[key].mainBlock !== undefined) {
                            mainBlock = current[key].mainBlock;
                          }
                          if (current[key].subcategories) {
                            current = current[key].subcategories;
                          } else {
                            break;
                          }
                        }
                      }

                      if (selectedBoard && selectedGradeBand) {
                        const gradeIndex = GRADE_BANDS.indexOf(selectedGradeBand);
                        if (gradeIndex >= 0 && SCHOOL_BOARD_TIMINGS[selectedBoard]) {
                          const timing = SCHOOL_BOARD_TIMINGS[selectedBoard][gradeIndex];
                          events.push({ name: 'School', startTime: timing[0], endTime: timing[1] });
                        }
                      }
                      
                      if (mainBlock) {
                        events.push(mainBlock);
                      }

                      applyTemplateEvents(events, true);
                    }}
                    className="pill-button"
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    Preview Template
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compact Toolbar */}
      <div style={{ 
        marginBottom: 16, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8, 
        flexWrap: 'wrap',
        padding: '8px 12px',
        background: '#F5F0E8',
        borderRadius: 8,
        border: '1px solid #E5E7EB'
      }}>
        {/* Group 1: View Controls */}
        <div style={{ display: 'flex', gap: 4, borderRight: '1px solid #D1D5DB', paddingRight: 12 }}>
          <button
            className={`pill-button ${viewMode === 'list' ? '' : 'secondary'}`}
            style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => setViewMode('list')}
          >
            <i className="ti ti-list" style={{ fontSize: 14 }} />
            List
          </button>
          <button
            className={`pill-button ${viewMode === 'week' ? '' : 'secondary'}`}
            style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => setViewMode('week')}
          >
            <i className="ti ti-calendar-week" style={{ fontSize: 14 }} />
            Week
          </button>
        </div>

        {/* Group 2: Template Actions */}
        <div style={{ display: 'flex', gap: 4, borderRight: '1px solid #D1D5DB', paddingRight: 12 }}>
          <button
            onClick={() => setShowTemplatePicker(true)}
            className="pill-button secondary"
            style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            data-tour="select-template-button"
          >
            <i className="ti ti-template" style={{ fontSize: 14 }} />
            Select Template
          </button>
          {viewMode === 'week' && !previewMode && (
            <button
              className="pill-button secondary"
              style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => {
                if (window.confirm('Reset all template-sourced events to their default values? This will discard your manual edits.')) {
                  handleResetToTemplate();
                }
              }}
            >
              <i className="ti ti-refresh" style={{ fontSize: 14 }} />
              Reset
            </button>
          )}
        </div>

        {/* Group 3: Destructive */}
        {viewMode === 'week' && !previewMode && (
          <div style={{ display: 'flex', gap: 4, borderRight: '1px solid #D1D5DB', paddingRight: 12 }}>
            <button
              className="pill-button secondary"
              style={{ 
                padding: '6px 10px', 
                fontSize: 12, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 4,
                border: '1px solid #EF4444', 
                color: '#EF4444',
                backgroundColor: '#FEF2F2'
              }}
              onClick={() => {
                if (window.confirm(`Clear all ${events.length} events? This action cannot be undone.`)) {
                  handleClearAllEvents();
                }
              }}
            >
              <i className="ti ti-trash" style={{ fontSize: 14 }} />
              Clear All
            </button>
          </div>
        )}

        {/* Group 4: Utility */}
        <div style={{ position: 'relative', display: 'flex', gap: 4 }}>
          <button
            className="pill-button secondary"
            style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => setShowPrintMenu(!showPrintMenu)}
          >
            <i className="ti ti-printer" style={{ fontSize: 14 }} />
            Print
          </button>
          
          {/* Print Dropdown Menu */}
          {showPrintMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              backgroundColor: 'white',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 100,
              minWidth: 150
            }}>
              <button
                onClick={handlePrint}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 14,
                  borderBottom: '1px solid #E5E7EB'
                }}
              >
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Download PDF
              </button>
            </div>
          )}
        </div>

        {/* Preview Mode Badge */}
        {previewMode && (
          <span style={{ 
            padding: '4px 8px', 
            backgroundColor: '#FEF3C7', 
            color: '#92400E', 
            borderRadius: 4, 
            fontSize: 11, 
            fontWeight: 600,
            marginLeft: 'auto'
          }}>
            PREVIEW MODE
          </span>
        )}

        {/* Preview Mode Actions */}
        {previewMode && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="pill-button"
              style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={handleApplyPreviewEvents}
            >
              <i className="ti ti-check" style={{ fontSize: 14 }} />
              Apply
            </button>
            <button
              className="pill-button secondary"
              style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={handleCancelPreview}
            >
              <i className="ti ti-x" style={{ fontSize: 14 }} />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Print Dropdown Menu */}
      {showPrintMenu && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 4,
          backgroundColor: 'white',
          border: '1px solid #D1D5DB',
          borderRadius: 8,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 10,
          minWidth: 150
        }}>
          <button
            onClick={handlePrint}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: 14,
              borderBottom: '1px solid #E5E7EB'
            }}
          >
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Download PDF
          </button>
        </div>
      )}

      {/* Inline Add/Edit Event Form */}
      {showAddEventForm && (
        <div style={{ 
          backgroundColor: '#F9FAFB', 
          border: '1px solid #D1D5DB', 
          borderRadius: 8, 
          padding: 16, 
          marginBottom: 16 
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>
            {editingEvent ? 'Edit Event' : 'Add Event'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Title:</label>
              <input 
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Event title"
                style={{ width: '100%', padding: '6px', borderRadius: 4, border: '1px solid #D1D5DB' }}
              />
            </div>
            <div></div>
            <div>
              <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Start Time:</label>
              <input 
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                style={{ width: '100%', padding: '6px', borderRadius: 4, border: '1px solid #D1D5DB' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>End Time:</label>
              <input 
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                style={{ width: '100%', padding: '6px', borderRadius: 4, border: '1px solid #D1D5DB' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Days:</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {DAYS.map(day => (
                <label key={day.value} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input 
                    type="checkbox"
                    checked={formData.daysOfWeek.includes(day.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          daysOfWeek: [...formData.daysOfWeek, day.value]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          daysOfWeek: formData.daysOfWeek.filter(d => d !== day.value)
                        });
                      }
                    }}
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <input 
                type="checkbox"
                checked={formData.isOneTime}
                onChange={(e) => setFormData({...formData, isOneTime: e.target.checked})}
              />
              One-time event (not recurring)
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveEvent} disabled={loading} className="pill-button">
              {loading ? 'Saving...' : (editingEvent ? 'Update Event' : 'Add Event')}
            </button>
            {editingEvent && (
              <button 
                onClick={() => {
                  if (window.confirm(`Delete "${editingEvent.title}"?`)) {
                    deleteEvent(editingEvent.id);
                    setShowAddEventForm(false);
                    setEditingEvent(null);
                  }
                }} 
                className="pill-button"
                style={{ backgroundColor: '#EF4444', color: 'white' }}
              >
                Delete
              </button>
            )}
            <button onClick={() => { 
              setShowAddEventForm(false); 
              setAddEventSlot(null); 
              setEditingEvent(null); 
            }} className="pill-button secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hidden printable schedule for PDF generation */}
      <div className="printable-schedule-container" style={{ display: 'none' }}>
        <div ref={printRef}>
          <PrintableSchedule schedule={schedule} weeklyCycle={weeklyCycle} heatmapData={heatmapData} />
        </div>
      </div>

      {/* Print-specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-schedule-container,
          .printable-schedule-container * {
            visibility: visible;
          }
          .printable-schedule-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100vh;
          }
          @page {
            size: landscape;
            margin: 0.5cm;
          }
        }
        @media print and (orientation: portrait) {
          @page {
            size: portrait;
            margin: 0.5cm;
          }
        }
      `}</style>

      {viewMode === 'list' && (
        <div>
          <div className="day-tabs" style={{ marginBottom: 16 }}>
            {DAYS.map((day) => (
              <button
                key={day.value}
                className={`day-tab ${selectedDay === day.value ? 'active' : ''}`}
                onClick={() => setSelectedDay(day.value)}
              >
                {day.label}
              </button>
            ))}
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            {DAY_NAMES[selectedDay]}'s Schedule
          </h3>
          
          {daySchedule.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 40, 
              color: '#9CA3AF',
              fontSize: 14 
            }}>
              No schedule for this day.
            </div>
          ) : (
            daySchedule.map((slot, index) => (
              <div 
                key={index} 
                className={`timeline-slot ${slot.color}`}
                onClick={() => slot.type === 'revision' ? onSelectUnit(slot) : null}
                style={{ cursor: slot.type === 'revision' ? 'pointer' : 'default' }}
              >
                <div className="timeline-time">{slot.time}</div>
                <div className="timeline-content">
                  <div className="timeline-title">{slot.sipara} ({slot.quality})</div>
                  <div className="timeline-details">
                    Pages {slot.pages} • {slot.duration}
                  </div>
                  <span className={`badge ${slot.color === 'green' ? 'green' : slot.color === 'yellow' ? 'yellow' : slot.color === 'orange' ? 'orange' : 'red'}`}>
                    {slot.method}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {viewMode === 'week' && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <WeekGridView 
            weeklyCycle={weeklyCycle}
            heatmapData={heatmapData}
            events={events}
            onSelectUnit={onSelectUnit}
            onEmptySlotClick={handleEmptySlotClick}
            onOccupiedSlotClick={handleOccupiedSlotClick}
            isSlotOccupied={isSlotOccupied}
            onEventDrop={handleEventDrop}
            onFixedEventClick={handleFixedEventClick}
            previewEvents={previewEvents}
            previewMode={previewMode}
          />
        </div>
      )}
    </div>
  );
}
