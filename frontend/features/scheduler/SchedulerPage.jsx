import React, { useState, useEffect } from 'react';
import { schedulerApi } from './services/schedulerApi';
import { deduplicateEvents } from './utils/eventDedup';
import EventBuilder from './components/EventBuilder';
import RevisionUnits from './components/RevisionUnits';
import ScheduleView from './components/ScheduleView';
import './SchedulerPage.css';

export default function SchedulerPage({ onBack }) {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [revisionUnits, setRevisionUnits] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await schedulerApi.getEvents();
      setEvents(deduplicateEvents(data));
    } catch (err) {
      setError('Failed to load events');
    }
  };

  const loadRevisionUnits = async () => {
    try {
      setLoading(true);
      const data = await schedulerApi.getRevisionUnits();
      setRevisionUnits(data);
    } catch (err) {
      setError('Failed to load revision units');
    } finally {
      setLoading(false);
    }
  };

  const generateSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First generate revision units
      const units = await schedulerApi.generateRevisionUnits({
        weeklyCycle: null, // Will get from existing wizard
        currentSipara: null,
        userProgress: null
      });
      setRevisionUnits(units);

      // Then generate schedule
      const scheduleData = await schedulerApi.generateSchedule({
        weekStart: null,
        userProgress: null,
        userGoals: null,
        commitments: null
      });
      setSchedule(scheduleData);
      setActiveTab('schedule');
    } catch (err) {
      setError('Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scheduler-page">
      <div className="scheduler-header">
        <h1>Quran Scheduler</h1>
        <div className="scheduler-tabs">
          <button
            className={activeTab === 'events' ? 'active' : ''}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
          <button
            className={activeTab === 'units' ? 'active' : ''}
            onClick={() => { setActiveTab('units'); loadRevisionUnits(); }}
          >
            Revision Units
          </button>
          <button
            className={activeTab === 'schedule' ? 'active' : ''}
            onClick={() => setActiveTab('schedule')}
          >
            Schedule
          </button>
        </div>
        <button className="generate-btn" onClick={generateSchedule} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Schedule'}
        </button>
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            Back
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {activeTab === 'events' && (
        <EventBuilder events={events} onEventsChange={loadEvents} />
      )}

      {activeTab === 'units' && (
        <RevisionUnits units={revisionUnits} loading={loading} />
      )}

      {activeTab === 'schedule' && (
        <ScheduleView schedule={schedule} loading={loading} />
      )}
    </div>
  );
}
