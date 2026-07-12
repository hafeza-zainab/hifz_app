import React, { useState } from 'react';
import { schedulerApi } from '../services/schedulerApi';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

export default function EventBuilder({ events, onEventsChange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    daysOfWeek: [1, 2, 3, 4, 5],
    isFixed: true,
    priority: 'medium'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await schedulerApi.updateEvent(editingEvent.id, formData);
      } else {
        await schedulerApi.createEvent(formData);
      }
      onEventsChange();
      setShowForm(false);
      setEditingEvent(null);
      setFormData({
        title: '',
        startTime: '',
        endTime: '',
        daysOfWeek: [1, 2, 3, 4, 5],
        isFixed: true,
        priority: 'medium'
      });
    } catch (err) {
      console.error('Failed to save event:', err);
    }
  };

  const handleDelete = async (eventId) => {
    try {
      await schedulerApi.deleteEvent(eventId);
      onEventsChange();
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      daysOfWeek: event.daysOfWeek,
      isFixed: event.isFixed,
      priority: event.priority
    });
    setShowForm(true);
  };

  const handleCopy = async (eventId) => {
    const targetDays = prompt('Enter target days (comma-separated, 0-6):', '0,6');
    if (targetDays) {
      try {
        const days = targetDays.split(',').map(d => parseInt(d.trim()));
        await schedulerApi.copyEvent(eventId, days);
        onEventsChange();
      } catch (err) {
        console.error('Failed to copy event:', err);
      }
    }
  };

  const toggleDay = (day) => {
    setFormData({
      ...formData,
      daysOfWeek: formData.daysOfWeek.includes(day)
        ? formData.daysOfWeek.filter(d => d !== day)
        : [...formData.daysOfWeek, day]
    });
  };

  return (
    <div className="event-builder">
      <div className="event-builder-header">
        <h2>Events</h2>
        <button onClick={() => setShowForm(true)}>+ Add Event</button>
      </div>

      {showForm && (
        <form className="event-form" onSubmit={handleSubmit}>
          <h3>{editingEvent ? 'Edit Event' : 'New Event'}</h3>
          
          <label>Title:</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <label>Start Time:</label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            required
          />

          <label>End Time:</label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            required
          />

          <label>Days:</label>
          <div className="days-selector">
            {DAYS_OF_WEEK.map(day => (
              <label key={day.value}>
                <input
                  type="checkbox"
                  checked={formData.daysOfWeek.includes(day.value)}
                  onChange={() => toggleDay(day.value)}
                />
                {day.label}
              </label>
            ))}
          </div>

          <label>
            <input
              type="checkbox"
              checked={formData.isFixed}
              onChange={(e) => setFormData({ ...formData, isFixed: e.target.checked })}
            />
            Fixed (cannot be moved by scheduler)
          </label>

          <label>Priority:</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <div className="form-actions">
            <button type="submit">{editingEvent ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="events-list">
        {(events || []).map(event => (
          <div key={event.id} className="event-card">
            <div className="event-info">
              <h4>{event.title}</h4>
              <p>{event.startTime} - {event.endTime}</p>
              <p>Days: {event.daysOfWeek.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ')}</p>
              {event.isFixed && <span className="badge fixed">Fixed</span>}
            </div>
            <div className="event-actions">
              <button onClick={() => handleEdit(event)}>Edit</button>
              <button onClick={() => handleCopy(event.id)}>Copy</button>
              <button onClick={() => handleDelete(event.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
