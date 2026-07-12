import React, { useState, useEffect } from 'react';
import { schedulerApi } from '../services/schedulerApi';
import { deduplicateEvents } from '../utils/eventDedup';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];


// Parse time string "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Merge overlapping time intervals
const mergeIntervals = (intervals) => {
  if (intervals.length === 0) return [];
  
  // Sort by start time
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  
  const merged = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    
    // Check if intervals overlap
    if (current.start <= last.end) {
      // Merge them
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push(current);
    }
  }
  
  return merged;
};

// Calculate total duration of merged intervals
const calculateTotalDuration = (intervals) => {
  return intervals.reduce((total, interval) => {
    return total + (interval.end - interval.start);
  }, 0);
};

export default function Review({ events, exceptions, onNext, onBack, onEditRoutine }) {
  const [dbEvents, setDbEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReusePrompt, setShowReusePrompt] = useState(false);
  const [freeTime, setFreeTime] = useState([]);
  const [fixedEvents, setFixedEvents] = useState([]);
  const [weeklyEvents, setWeeklyEvents] = useState([]);

  // Fetch actual events from database on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const fetchedEvents = await schedulerApi.getEvents();
        console.log('Review: Raw API response:', fetchedEvents);
        console.log('Review: Fetched events from DB:', fetchedEvents);
        
        // Deduplicate events
        const deduplicatedEvents = deduplicateEvents(fetchedEvents || []);
        console.log(`Review: Deduplicated to ${deduplicatedEvents.length} unique events`);
        
        setDbEvents(deduplicatedEvents);
        
        // Show reuse prompt if there are saved events
        if (deduplicatedEvents.length > 0) {
          setShowReusePrompt(true);
        }
      } catch (err) {
        console.error('Review: Failed to fetch events:', err);
        setDbEvents(deduplicateEvents(events || []));
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Calculate free time and event counts when dbEvents changes
  useEffect(() => {
    const eventsToUse = dbEvents.length > 0 ? dbEvents : (events || []);
    console.log('Review: Calculating with events:', eventsToUse);

    // Count events
    const fixed = eventsToUse.filter(e => e && e.isFixed);
    const weekly = eventsToUse.filter(e => e && !e.isFixed);
    
    console.log('Review: Fixed events count:', fixed.length);
    console.log('Review: Weekly events count:', weekly.length);
    
    setFixedEvents(fixed);
    setWeeklyEvents(weekly);

    // Calculate free time for each day
    const calculatedFreeTime = DAYS.map(day => {
      // Start with 24 hours
      let totalMinutes = 24 * 60;
      
      // Subtract 8 hours for sleep (480 minutes)
      totalMinutes -= 480;
      
      // Get events for this day
      const dayEvents = eventsToUse.filter(e => 
        e && e.daysOfWeek && e.daysOfWeek.includes(day.value)
      );
      
      console.log(`Review: Events for ${day.label}:`, dayEvents);
      
      // Convert events to time intervals
      const intervals = dayEvents
        .filter(event => event.startTime && event.endTime)
        .map(event => ({
          start: timeToMinutes(event.startTime),
          end: timeToMinutes(event.endTime)
        }));
      
      console.log(`Review: Time intervals for ${day.label}:`, intervals);
      
      // Merge overlapping intervals
      const mergedIntervals = mergeIntervals(intervals);
      console.log(`Review: Merged intervals for ${day.label}:`, mergedIntervals);
      
      // Calculate total duration from merged intervals
      const totalEventDuration = calculateTotalDuration(mergedIntervals);
      console.log(`Review: Total event duration for ${day.label}: ${totalEventDuration} minutes`);
      
      // Subtract merged duration
      totalMinutes -= totalEventDuration;
      
      // Floor at 0 (no negative free time)
      totalMinutes = Math.max(0, totalMinutes);
      
      // Convert to hours and minutes
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      console.log(`Review: Free time for ${day.label}: ${hours}h ${minutes}m`);
      
      return {
        day: day.label,
        hours,
        minutes,
        formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
      };
    });
    
    setFreeTime(calculatedFreeTime);
  }, [dbEvents, events]);

  if (loading) {
    return (
      <div className="review">
        <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>
          Loading...
        </div>
      </div>
    );
  }

  // Show reuse prompt if there are saved events
  if (showReusePrompt) {
    return (
      <div className="review">
        <div className="banner info">
          <div className="banner-icon">📋</div>
          <div className="banner-text">Your routine is the same as last week — use it again?</div>
        </div>

        <div className="card">
          <h2 className="card-title">Saved Routine Found</h2>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
            You have {dbEvents.length} events saved from your previous routine.
          </p>
          
          <div style={{ marginBottom: 16 }}>
            {dbEvents.slice(0, 5).map((event) => (
              <div key={event.id} style={{ 
                padding: '8px 12px', 
                background: '#F9FAFB', 
                borderRadius: 6, 
                marginBottom: 8,
                fontSize: 13,
                color: '#374151'
              }}>
                {event.title} • {event.startTime} - {event.endTime}
              </div>
            ))}
            {dbEvents.length > 5 && (
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
                ...and {dbEvents.length - 5} more events
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              className="pill-button" 
              onClick={() => {
                setShowReusePrompt(false);
                onNext();
              }}
              style={{ flex: 1 }}
            >
              Yes, Generate Schedule
            </button>
            <button 
              className="pill-button secondary" 
              onClick={() => {
                setShowReusePrompt(false);
                if (onEditRoutine) {
                  onEditRoutine();
                } else {
                  onBack();
                }
              }}
              style={{ flex: 1 }}
            >
              Edit Routine First
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="review">
      <div className="banner success">
        <div className="banner-icon">✓</div>
        <div className="banner-text">Your week looks good!</div>
      </div>

      <div className="card">
        <h2 className="card-title">Summary</h2>
        
        <div className="stat-row">
          <span className="stat-label">Fixed Events</span>
          <span className="stat-value">{fixedEvents.length}</span>
        </div>
        
        <div className="stat-row">
          <span className="stat-label">Weekly Events</span>
          <span className="stat-value">{weeklyEvents.length}</span>
        </div>
        
        <div className="stat-row">
          <span className="stat-label">Exceptions</span>
          <span className="stat-value">{(exceptions || []).length}</span>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Estimated Free Time</h2>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Available Hours</th>
            </tr>
          </thead>
          <tbody>
            {freeTime.map((item) => (
              <tr key={item.day}>
                <td>{item.day}</td>
                <td>{item.formatted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="pill-button" onClick={onNext}>
        Generate My Schedule ✨
      </button>
      
      <button className="pill-button secondary" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
