import React from 'react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ScheduleView({ schedule, loading }) {
  if (loading) {
    return <div className="loading">Loading schedule...</div>;
  }

  if (!schedule) {
    return (
      <div className="schedule-empty">
        <h2>Weekly Schedule</h2>
        <p>No schedule generated yet. Click "Generate Schedule" to create your weekly plan.</p>
      </div>
    );
  }

  const scheduleData = schedule.schedule || {};

  return (
    <div className="schedule-view">
      <h2>Weekly Schedule</h2>
      
      <div className="schedule-stats">
        <div className="stat-card">
          <h4>Total Scheduled</h4>
          <p>{Object.values(scheduleData).reduce((sum, day) => sum + day?.stats?.totalScheduledMinutes || 0, 0)} min</p>
        </div>
        <div className="stat-card">
          <h4>Muraja'ah Units</h4>
          <p>{Object.values(scheduleData).reduce((sum, day) => sum + day?.stats?.murajaahUnits || 0, 0)}</p>
        </div>
        <div className="stat-card">
          <h4>Juz Hali Units</h4>
          <p>{Object.values(scheduleData).reduce((sum, day) => sum + day?.stats?.juzHaliUnits || 0, 0)}</p>
        </div>
        <div className="stat-card">
          <h4>Jadeed Units</h4>
          <p>{Object.values(scheduleData).reduce((sum, day) => sum + day?.stats?.jadeedUnits || 0, 0)}</p>
        </div>
        <div className="stat-card">
          <h4>Total Pages</h4>
          <p>{Object.values(scheduleData).reduce((sum, day) => sum + day?.stats?.totalPagesCovered || 0, 0)}</p>
        </div>
      </div>

      <div className="weekly-timeline">
        {DAYS.map((dayName, dayIndex) => {
          const daySchedule = scheduleData[dayIndex];
          if (!daySchedule) return null;

          return (
            <div key={dayIndex} className="day-column">
              <h3>{dayName}</h3>
              <div className="day-events">
                {daySchedule.events.map((event, idx) => (
                  <div
                    key={`${event.eventId || event.revisionUnitId}-${idx}`}
                    className={`event-block ${event.isFixed ? 'fixed' : 'scheduled'}`}
                  >
                    <div className="event-time">
                      {event.startTime} - {event.endTime}
                    </div>
                    <div className="event-title">{event.title}</div>
                    {!event.isFixed && (
                      <div className="event-details">
                        <span className="work-type">{event.workType}</span>
                        {event.pages && <span className="pages">{event.pages.join(', ')}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {daySchedule.gaps.length > 0 && (
                <div className="day-gaps">
                  <p>Available gaps: {daySchedule.gaps.length}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {schedule.violations && schedule.violations.length > 0 && (
        <div className="schedule-violations">
          <h3>Violations</h3>
          {schedule.violations.map((violation, idx) => (
            <div key={idx} className={`violation ${violation.severity}`}>
              {violation.type}: {violation.message}
            </div>
          ))}
        </div>
      )}

      {schedule.warnings && schedule.warnings.length > 0 && (
        <div className="schedule-warnings">
          <h3>Warnings</h3>
          {schedule.warnings.map((warning, idx) => (
            <div key={idx} className="warning">
              {warning.type}: {warning.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
