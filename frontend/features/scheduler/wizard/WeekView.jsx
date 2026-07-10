import React, { useState, useEffect } from 'react';
import { schedulerApi } from '../services/schedulerApi';

const DAYS = [
  { value: 0, label: 'S' },
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' }
];

// Event type to color mapping
const getEventColor = (title) => {
  const lowerTitle = title.toLowerCase();
  
  // Prayer events
  if (lowerTitle.includes('prayer') || lowerTitle.includes('fajr') || lowerTitle.includes('tahajjud')) {
    return '#2D6A4F'; // Green/Teal
  }
  
  // Meal events
  if (lowerTitle.includes('lunch') || lowerTitle.includes('dinner') || lowerTitle.includes('breakfast') || lowerTitle.includes('meal')) {
    return '#F59E0B'; // Orange/Amber
  }
  
  // Work/School events
  if (lowerTitle.includes('work') || lowerTitle.includes('school') || lowerTitle.includes('homework') || lowerTitle.includes('hifz')) {
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

// Built-in templates
const BUILT_IN_TEMPLATES = {
  school: {
    name: 'School Schedule',
    events: [
      { title: 'Sleep', startTime: '22:00', endTime: '06:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], isFixed: true },
      { title: 'Fajr Prayer', startTime: '05:30', endTime: '06:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], isFixed: true },
      { title: 'School', startTime: '08:00', endTime: '15:00', daysOfWeek: [1, 2, 3, 4, 5], isFixed: true },
      { title: 'Lunch', startTime: '13:00', endTime: '13:30', daysOfWeek: [1, 2, 3, 4, 5], isFixed: true },
      { title: 'Homework', startTime: '16:00', endTime: '18:00', daysOfWeek: [1, 2, 3, 4, 5], isFixed: true },
      { title: 'Dinner', startTime: '19:00', endTime: '20:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], isFixed: true },
    ]
  },
  working: {
    name: 'Working Professional',
    events: [
      { title: 'Sleep', startTime: '23:00', endTime: '07:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], isFixed: true },
      { title: 'Fajr Prayer', startTime: '05:30', endTime: '06:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], isFixed: true },
      { title: 'Work', startTime: '09:00', endTime: '18:00', daysOfWeek: [1, 2, 3, 4, 5], isFixed: true },
      { title: 'Lunch', startTime: '13:00', endTime: '14:00', daysOfWeek: [1, 2, 3, 4, 5], isFixed: true },
      { title: 'Exercise', startTime: '19:00', endTime: '20:00', daysOfWeek: [1, 3, 5], isFixed: true },
      { title: 'Dinner', startTime: '20:30', endTime: '21:30', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], isFixed: true },
    ]
  },
  hifz: {
    name: 'Full-Time Hifz',
    events: [
      { title: 'Sleep', startTime: '21:00', endTime: '05:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], isFixed: true },
      { title: 'Tahajjud', startTime: '03:00', endTime: '04:30', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], isFixed: true },
      { title: 'Fajr Prayer', startTime: '05:00', endTime: '05:30', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], isFixed: true },
      { title: 'Morning Hifz', startTime: '06:00', endTime: '09:00', daysOfWeek: [1, 2, 3, 4, 5], isFixed: true },
      { title: 'Breakfast', startTime: '09:00', endTime: '09:30', daysOfWeek: [1, 2, 3, 4, 5], isFixed: true },
      { title: 'Afternoon Hifz', startTime: '10:00', endTime: '13:00', daysOfWeek: [1, 2, 3, 4, 5], isFixed: true },
      { title: 'Lunch', startTime: '13:00', endTime: '14:00', daysOfWeek: [1, 2, 3, 4, 5], isFixed: true },
      { title: 'Evening Hifz', startTime: '16:00', endTime: '19:00', daysOfWeek: [1, 2, 3, 4, 5], isFixed: true },
      { title: 'Dinner', startTime: '19:30', endTime: '20:30', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], isFixed: true },
    ]
  }
};

export default function WeekView({ events, exceptions, onEventsChange, onExceptionsChange, onNext, onBack }) {
  const [localEvents, setLocalEvents] = useState(events || []);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [previewEvents, setPreviewEvents] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    daysOfWeek: [1, 2, 3, 4, 5],
    isFixed: true,
    isOneTime: false,
    priority: 'medium'
  });
  const [conflictDialog, setConflictDialog] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalEvents(events || []);
  }, [events]);

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
    
    // Check if they share any days
    const sharedDays = event1.daysOfWeek.some(day => event2.daysOfWeek.includes(day));
    if (!sharedDays) return false;
    
    // Check time overlap
    return start1 < end2 && end1 > start2;
  };

  // Helper: Merge daysOfWeek arrays with deduplication and sorting
  const mergeDaysOfWeek = (existingDays, newDays) => {
    const merged = new Set([...(existingDays || []), ...(newDays || [])]);
    return Array.from(merged).sort((a, b) => a - b);
  };

  // Apply template with conflict resolution
  const applyTemplate = async (templateKey) => {
    if (!templateKey) return;
    
    const template = BUILT_IN_TEMPLATES[templateKey];
    if (!template) return;

    setLoading(true);
    const conflicts = [];
    const eventsToPreview = [];

    // Check for conflicts
    template.events.forEach(templateEvent => {
      const existingEvent = localEvents.find(e => 
        e.title === templateEvent.title && 
        e.startTime === templateEvent.startTime &&
        e.endTime === templateEvent.endTime
      );

      if (existingEvent) {
        // Merge daysOfWeek
        const mergedDays = mergeDaysOfWeek(existingEvent.daysOfWeek, templateEvent.daysOfWeek);
        eventsToPreview.push({
          ...existingEvent,
          daysOfWeek: mergedDays,
          sourceTemplate: templateKey
        });
      } else {
        // Check for overlap with existing events
        const overlappingEvent = localEvents.find(e => eventsOverlap(e, templateEvent));
        if (overlappingEvent) {
          conflicts.push({
            template: templateEvent,
            existing: overlappingEvent
          });
        } else {
          eventsToPreview.push({ 
            ...templateEvent, 
            sourceTemplate: templateKey,
            id: `preview_${templateEvent.title}_${templateEvent.startTime}`
          });
        }
      }
    });

    if (conflicts.length > 0) {
      setConflictDialog({ conflicts, eventsToPreview });
      setLoading(false);
      return;
    }

    // No conflicts, show preview
    setPreviewEvents(eventsToPreview);
    setPreviewMode(true);
    setLoading(false);
  };

  // Save events to backend
  const saveEvents = async (eventsToSave) => {
    try {
      setLoading(true);
      
      // Delete existing events that are being replaced
      for (const event of eventsToSave) {
        if (event.id) {
          await schedulerApi.deleteEvent(event.id);
        }
      }

      // Create new events
      for (const event of eventsToSave) {
        await schedulerApi.createEvent({
          ...event,
          daysOfWeek: event.daysOfWeek.sort((a, b) => a - b) // Ensure sorted
        });
      }

      // Reload events
      await onEventsChange();
      setLoading(false);
    } catch (error) {
      console.error('Failed to save events:', error);
      setLoading(false);
    }
  };

  // Handle conflict resolution
  const handleConflictResolution = async (action) => {
    if (!conflictDialog) return;

    let eventsToPreview = [...conflictDialog.eventsToPreview];

    if (action === 'skip') {
      // Skip conflicting template events
      eventsToPreview = eventsToPreview.filter(e => 
        !conflictDialog.conflicts.some(c => c.template.title === e.title)
      );
    } else if (action === 'replace') {
      // Replace existing conflicting events
      const conflictingTitles = conflictDialog.conflicts.map(c => c.existing.title);
      eventsToPreview = eventsToPreview.filter(e => 
        !conflictingTitles.includes(e.title)
      );
    }
    // 'keepBoth' keeps all events as-is

    setPreviewEvents(eventsToPreview);
    setPreviewMode(true);
    setConflictDialog(null);
  };

  // Apply preview events to backend
  const applyPreviewEvents = async () => {
    if (!previewEvents || previewEvents.length === 0) return;

    await saveEvents(previewEvents);
    setPreviewMode(false);
    setPreviewEvents(null);
  };

  // Cancel preview
  const cancelPreview = () => {
    setPreviewMode(false);
    setPreviewEvents(null);
  };

  // Edit event in preview mode
  const handlePreviewEdit = (event, index) => {
    const updatedPreviewEvents = [...previewEvents];
    updatedPreviewEvents[index] = { ...event, ...formData };
    setPreviewEvents(updatedPreviewEvents);
    handleCancelForm();
  };

  // Reset events to template defaults
  const resetToTemplateDefaults = async () => {
    if (!showResetDialog) return;

    const templateKey = showResetDialog;
    const template = BUILT_IN_TEMPLATES[templateKey];
    if (!template) return;

    setLoading(true);

    try {
      // Find events that were sourced from this template
      const templateEvents = localEvents.filter(e => e.sourceTemplate === templateKey);
      
      // Delete these events
      for (const event of templateEvents) {
        if (event.id) {
          await schedulerApi.deleteEvent(event.id);
        }
      }

      // Re-create events from template defaults
      for (const templateEvent of template.events) {
        await schedulerApi.createEvent({
          ...templateEvent,
          sourceTemplate: templateKey
        });
      }

      await onEventsChange();
      setLoading(false);
      setShowResetDialog(null);
    } catch (error) {
      console.error('Failed to reset events:', error);
      setLoading(false);
    }
  };

  // Show reset confirmation dialog
  const handleResetClick = () => {
    // Find which template has events in the current schedule
    const templateKeys = new Set(localEvents.filter(e => e.sourceTemplate).map(e => e.sourceTemplate));
    
    if (templateKeys.size === 0) {
      alert('No template-sourced events found to reset.');
      return;
    }

    if (templateKeys.size === 1) {
      setShowResetDialog(Array.from(templateKeys)[0]);
    } else {
      // Multiple templates - ask user which one to reset
      const templateName = prompt(
        `Multiple templates found: ${Array.from(templateKeys).map(k => BUILT_IN_TEMPLATES[k]?.name || k).join(', ')}\n\nEnter the template key to reset:`,
        Array.from(templateKeys)[0]
      );
      if (templateName && templateKeys.has(templateName)) {
        setShowResetDialog(templateName);
      }
    }
  };

  // Clear all events
  const clearAllEvents = async () => {
    setLoading(true);

    try {
      // Delete all current events
      for (const event of localEvents) {
        if (event.id) {
          await schedulerApi.deleteEvent(event.id);
        }
      }

      await onEventsChange();
      setLoading(false);
      setShowClearDialog(false);
    } catch (error) {
      console.error('Failed to clear events:', error);
      setLoading(false);
    }
  };

  // Add new event
  const addEvent = async () => {
    if (!formData.title || !formData.startTime || !formData.endTime) {
      return;
    }

    const newEvent = {
      ...formData,
      daysOfWeek: formData.daysOfWeek.sort((a, b) => a - b)
    };

    try {
      setLoading(true);
      await schedulerApi.createEvent(newEvent);
      await onEventsChange();
      setLoading(false);
      setShowAddForm(false);
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
      console.error('Failed to add event:', error);
      setLoading(false);
    }
  };

  // Edit existing event
  const editEvent = async () => {
    if (!formData.title || !formData.startTime || !formData.endTime) {
      return;
    }

    const updatedEvent = {
      ...formData,
      daysOfWeek: formData.daysOfWeek.sort((a, b) => a - b)
    };

    try {
      setLoading(true);
      
      if (previewMode && editingEvent.previewIndex !== undefined) {
        // Update preview array
        const updatedPreviewEvents = [...previewEvents];
        updatedPreviewEvents[editingEvent.previewIndex] = updatedEvent;
        setPreviewEvents(updatedPreviewEvents);
      } else {
        // Update via API
        await schedulerApi.updateEvent(editingEvent.id, updatedEvent);
        await onEventsChange();
      }
      
      setLoading(false);
      setEditingEvent(null);
      setShowAddForm(false);
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
      console.error('Failed to update event:', error);
      setLoading(false);
    }
  };

  // Open edit form for an event
  const handleEditClick = (event, index) => {
    if (previewMode) {
      // In preview mode, track the index for updating preview array
      setEditingEvent({ ...event, previewIndex: index });
    } else {
      setEditingEvent(event);
    }
    setFormData({
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      daysOfWeek: event.daysOfWeek || [1, 2, 3, 4, 5],
      isFixed: event.isFixed !== false,
      isOneTime: event.isOneTime || false,
      priority: event.priority || 'medium'
    });
    setShowAddForm(true);
  };

  // Cancel edit/add form
  const handleCancelForm = () => {
    setShowAddForm(false);
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

  // Get events for a specific day
  const getEventsForDay = (dayIndex) => {
    const eventsToShow = previewMode ? previewEvents : localEvents;
    return eventsToShow.filter(event => 
      event.daysOfWeek && event.daysOfWeek.includes(dayIndex)
    );
  };

  return (
    <div className="week-view">
      <div className="week-view-header">
        <h2>Weekly Schedule</h2>
        
        {/* Template Selection */}
        <div className="template-selector">
          <label>Select Template:</label>
          <select 
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            <option value="">Start from Scratch</option>
            {Object.entries(BUILT_IN_TEMPLATES).map(([key, template]) => (
              <option key={key} value={key}>{template.name}</option>
            ))}
          </select>
          <button 
            onClick={() => applyTemplate(selectedTemplate)}
            disabled={!selectedTemplate || loading}
          >
            {loading ? 'Loading...' : 'Preview Template'}
          </button>
        </div>

        {/* Preview Mode Actions */}
        {previewMode && (
          <div className="preview-actions">
            <span className="preview-badge">Preview Mode</span>
            <button 
              className="apply-btn"
              onClick={applyPreviewEvents}
              disabled={loading}
            >
              {loading ? 'Applying...' : 'Apply Template'}
            </button>
            <button 
              className="cancel-preview-btn"
              onClick={cancelPreview}
            >
              Cancel
            </button>
          </div>
        )}

        {!previewMode && (
          <>
            <button 
              className="add-event-btn"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              + Add Event
            </button>
            <button 
              className="reset-btn"
              onClick={handleResetClick}
            >
              Reset to Template
            </button>
            <button 
              className="clear-all-btn"
              onClick={() => setShowClearDialog(true)}
            >
              Clear All
            </button>
          </>
        )}
      </div>

      {/* Add/Edit Event Form */}
      {showAddForm && (
        <div className="add-event-form">
          <h3>{editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
          <div className="form-row">
            <label>Title:</label>
            <input 
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Event title"
            />
          </div>
          <div className="form-row">
            <label>Start Time:</label>
            <input 
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
            />
          </div>
          <div className="form-row">
            <label>End Time:</label>
            <input 
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
            />
          </div>
          <div className="form-row">
            <label>Days:</label>
            <div className="day-checkboxes">
              {DAYS.map(day => (
                <label key={day.value}>
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
          <div className="form-row">
            <label>
              <input 
                type="checkbox"
                checked={formData.isOneTime}
                onChange={(e) => setFormData({...formData, isOneTime: e.target.checked})}
              />
              One-time event (not recurring)
            </label>
          </div>
          <div className="form-actions">
            <button onClick={editingEvent ? editEvent : addEvent} disabled={loading}>
              {loading ? 'Saving...' : (editingEvent ? 'Update Event' : 'Add Event')}
            </button>
            <button onClick={handleCancelForm}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Conflict Dialog */}
      {conflictDialog && (
        <div className="conflict-dialog">
          <h3>Template Conflicts Detected</h3>
          <p>The following template events conflict with existing events:</p>
          <ul>
            {conflictDialog.conflicts.map((conflict, index) => (
              <li key={index}>
                <strong>{conflict.template.title}</strong> ({conflict.template.startTime}-{conflict.template.endTime})
                conflicts with 
                <strong>{conflict.existing.title}</strong> ({conflict.existing.startTime}-{conflict.existing.endTime})
              </li>
            ))}
          </ul>
          <div className="dialog-actions">
            <button onClick={() => handleConflictResolution('skip')}>
              Skip Conflicts
            </button>
            <button onClick={() => handleConflictResolution('replace')}>
              Replace Existing
            </button>
            <button onClick={() => handleConflictResolution('keepBoth')}>
              Keep Both
            </button>
            <button onClick={() => setConflictDialog(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetDialog && (
        <div className="conflict-dialog">
          <h3>Reset to Template Defaults</h3>
          <p>Are you sure you want to reset all events from the <strong>{BUILT_IN_TEMPLATES[showResetDialog]?.name}</strong> template back to their default values?</p>
          <p style={{ color: '#C0392B', fontSize: 13 }}>⚠️ This will discard any manual edits you made to these template events. Events you added manually will not be affected.</p>
          <div className="dialog-actions">
            <button onClick={resetToTemplateDefaults} disabled={loading}>
              {loading ? 'Resetting...' : 'Yes, Reset'}
            </button>
            <button onClick={() => setShowResetDialog(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Dialog */}
      {showClearDialog && (
        <div className="conflict-dialog">
          <h3>Clear All Events</h3>
          <p>Are you sure you want to remove all events from the current week view?</p>
          <p style={{ color: '#C0392B', fontSize: 13 }}>⚠️ This will delete {localEvents.length} event(s). This action cannot be undone.</p>
          <div className="dialog-actions">
            <button onClick={clearAllEvents} disabled={loading}>
              {loading ? 'Clearing...' : 'Yes, Clear All'}
            </button>
            <button onClick={() => setShowClearDialog(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Week Grid */}
      <div className="week-grid">
        {DAYS.map((day, dayIndex) => (
          <div key={day.value} className="day-column">
            <div className="day-header">{day.label}</div>
            <div className="day-events">
              {getEventsForDay(dayIndex).map((event, index) => (
                <div 
                  key={event.id || `${event.title}_${event.startTime}`}
                  className={`event-card ${event.isOneTime ? 'one-time' : 'recurring'} ${previewMode ? 'preview' : ''}`}
                  style={{ backgroundColor: getEventColor(event.title) }}
                  onClick={() => handleEditClick(event, index)}
                >
                  <div className="event-time">{event.startTime} - {event.endTime}</div>
                  <div className="event-title">{event.title}</div>
                  {!previewMode && (
                    <button 
                      className="delete-event-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEvent(event.id);
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="week-view-footer">
        <button onClick={onBack}>Back</button>
        <button onClick={onNext}>Continue to Generate Schedule</button>
      </div>
    </div>
  );
}
