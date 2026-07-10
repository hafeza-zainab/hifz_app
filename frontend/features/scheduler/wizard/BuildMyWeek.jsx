import React, { useState, useEffect } from 'react';
import { schedulerApi } from '../services/schedulerApi';
import { deduplicateEvents } from '../utils/eventDedup';

const DAYS = [
  { value: 0, label: 'S' },
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' }
];

// School board timings lookup table (same as backend)
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

const ROUTINE_ICONS = {
  sleep: '😴',
  school: '📚',
  commute: '🚗',
  gym: '💪',
  dinner: '🍽️',
  family: '👨‍👩‍👧‍👦',
  work: '💼',
  prayer: '🕌',
  quran: '📖',
  custom: '📌'
};


export default function BuildMyWeek({ events, onEventsChange, onNext, onBack }) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [localEvents, setLocalEvents] = useState(events || []);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    daysOfWeek: [1, 2, 3, 4, 5],
    isFixed: true,
    priority: 'medium'
  });
  const [formError, setFormError] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);

  // Template picker state
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templatePath, setTemplatePath] = useState([]);
  const [templateEvents, setTemplateEvents] = useState([]);
  const [selectedDaysForTemplate, setSelectedDaysForTemplate] = useState([1, 2, 3, 4, 5]);
  const [templates, setTemplates] = useState({ builtIn: null, custom: [] });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  
  // School board/grade selection state
  const [schoolBoards, setSchoolBoards] = useState({ boards: [], gradeBands: [] });
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedGradeBand, setSelectedGradeBand] = useState('');

  // Auto-fetch saved events on mount
  useEffect(() => {
    const fetchSavedEvents = async () => {
      try {
        const savedEvents = await schedulerApi.getEvents();
        console.log(`BuildMyWeek: Loaded ${savedEvents?.length || 0} events from DB:`, savedEvents);
        
        // Deduplicate events by title + startTime + endTime
        const deduplicatedEvents = savedEvents ? deduplicateEvents(savedEvents) : [];
        console.log(`BuildMyWeek: Deduplicated to ${deduplicatedEvents.length} unique events`);
        
        if (deduplicatedEvents.length > 0) {
          setLocalEvents(deduplicatedEvents);
        } else if (events && events.length > 0) {
          setLocalEvents(deduplicateEvents(events));
        }
      } catch (err) {
        console.error('BuildMyWeek: Failed to fetch saved events:', err);
        if (events && events.length > 0) {
          setLocalEvents(deduplicateEvents(events));
        }
      }
    };
    fetchSavedEvents();
  }, []);

  // Only sync local events with prop on initial mount if no saved events
  useEffect(() => {
    if (events && events.length > 0 && localEvents.length === 0) {
      setLocalEvents(deduplicateEvents(events));
    }
  }, []);

  // Fetch templates when picker opens
  useEffect(() => {
    if (showTemplatePicker && !templates.builtIn) {
      const fetchTemplates = async () => {
        try {
          const data = await schedulerApi.getTemplates();
          setTemplates({ builtIn: data.builtIn, custom: data.custom || [] });
        } catch (err) {
          console.error('Failed to fetch templates:', err);
        }
      };
      fetchTemplates();
    }
  }, [showTemplatePicker, templates.builtIn]);

  // Fetch school boards when needed
  useEffect(() => {
    if (showTemplatePicker && schoolBoards.boards.length === 0) {
      const fetchSchoolBoards = async () => {
        try {
          const data = await schedulerApi.getSchoolBoards();
         setSchoolBoards(data);
        } catch (err) {
          console.error('Failed to fetch school boards:', err);
        }
      };
      fetchSchoolBoards();
    }
  }, [showTemplatePicker, schoolBoards.boards.length]);

  const dayEvents = localEvents.filter(e => 
    e && e.daysOfWeek && e.daysOfWeek.includes(selectedDay)
  );
  
  console.log('All local events:', localEvents);
  console.log('Filtered dayEvents for selectedDay', selectedDay, ':', dayEvents);
  
  // Debug: log daysOfWeek for each event
  localEvents.forEach(e => {
    console.log(`Event "${e.title}": daysOfWeek =`, e.daysOfWeek, 'type:', typeof e.daysOfWeek[0]);
  });

  const getIconForEvent = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('sleep')) return ROUTINE_ICONS.sleep;
    if (lower.includes('school') || lower.includes('class')) return ROUTINE_ICONS.school;
    if (lower.includes('commute') || lower.includes('travel')) return ROUTINE_ICONS.commute;
    if (lower.includes('gym') || lower.includes('exercise')) return ROUTINE_ICONS.gym;
    if (lower.includes('dinner') || lower.includes('meal')) return ROUTINE_ICONS.dinner;
    if (lower.includes('family')) return ROUTINE_ICONS.family;
    if (lower.includes('work')) return ROUTINE_ICONS.work;
    if (lower.includes('prayer')) return ROUTINE_ICONS.prayer;
    if (lower.includes('quran')) return ROUTINE_ICONS.quran;
    return ROUTINE_ICONS.custom;
  };

  const handleCreate = async () => {
    // Validate inputs
    if (!formData.title.trim()) {
      setFormError('Please enter a title');
      return;
    }
    if (!formData.startTime) {
      setFormError('Please enter a start time');
      return;
    }
    if (!formData.endTime) {
      setFormError('Please enter an end time');
      return;
    }
    if (formData.daysOfWeek.length === 0) {
      setFormError('Please select at least one day');
      return;
    }

    setFormError('');

    try {
      console.log('BuildMyWeek: Creating event with payload:', JSON.stringify(formData, null, 2));
      
      let savedEvent;
      if (editingEvent) {
        // Update existing event
        savedEvent = await schedulerApi.updateEvent(editingEvent.id, formData);
        console.log('BuildMyWeek: Updated event from API:', savedEvent);
      } else {
        // Create new event
        savedEvent = await schedulerApi.createEvent(formData);
        console.log('BuildMyWeek: Saved event from API:', savedEvent);
      }
      
      if (!savedEvent) {
        setFormError('Failed to save event: no response from server');
        return;
      }
      
      // Update local state
      setLocalEvents(prev => {
        if (editingEvent) {
          return prev.map(e => e.id === editingEvent.id ? savedEvent : e);
        } else {
          return [...prev, savedEvent];
        }
      });
      
      // Also update parent state to persist across wizard steps
      if (onEventsChange) {
        onEventsChange();
      }
      
      // Clear form and hide
      setShowAddForm(false);
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
      setFormError('Failed to save event. Please try again.');
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      daysOfWeek: event.daysOfWeek || [1, 2, 3, 4, 5],
      isFixed: event.isFixed !== undefined ? event.isFixed : true,
      priority: event.priority || 'medium'
    });
    setShowAddForm(true);
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete "${event.title}"?`)) {
      return;
    }

    try {
      await schedulerApi.deleteEvent(event.id);
      setLocalEvents(prev => prev.filter(e => e.id !== event.id));
      if (onEventsChange) {
        onEventsChange();
      }
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert('Failed to delete event. Please try again.');
    }
  };

  const handlePreset = (preset) => {
    const presets = {
      school: { title: 'School', startTime: '08:00', endTime: '15:00', daysOfWeek: [1, 2, 3, 4, 5] },
      work: { title: 'Work', startTime: '09:00', endTime: '17:00', daysOfWeek: [1, 2, 3, 4, 5] },
      sleep: { title: 'Sleep', startTime: '22:00', endTime: '06:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
      gym: { title: 'Gym', startTime: '18:00', endTime: '19:00', daysOfWeek: [1, 3, 5] },
      commute: { title: 'Commute', startTime: '07:30', endTime: '08:30', daysOfWeek: [1, 2, 3, 4, 5] }
    };
    
    const presetData = presets[preset];
    if (presetData) {
      setFormData({
        ...formData,
        ...presetData,
        isFixed: true,
        priority: 'medium'
      });
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

  // Template navigation functions
  const navigateToTemplate = (key, isLeaf = false) => {
    const newPath = [...templatePath, key];
    setTemplatePath(newPath);
    
    if (isLeaf) {
      // Resolve template to events
      resolveTemplateToEvents(newPath);
    }
  };

  const navigateBack = () => {
    if (templatePath.length > 0) {
      const newPath = templatePath.slice(0, -1);
      setTemplatePath(newPath);
      setTemplateEvents([]);
      // Reset board/grade selection if going back from school subcategory
      if (newPath.length === 1 && (newPath[0] === 'msb' || newPath[0] === 'regular')) {
        setSelectedBoard('');
        setSelectedGradeBand('');
      }
    } else {
      setShowTemplatePicker(false);
    }
  };

  const resolveTemplateToEvents = (path) => {
    // Get current node in hierarchy
    let current = templates.builtIn;
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

    // Universal defaults
    const universalDefaults = [
      { name: 'Fajr', startTime: '05:00', endTime: '05:30' },
      { name: 'Breakfast', startTime: '07:00', endTime: '07:30' },
      { name: 'Lunch', startTime: '12:30', endTime: '13:00' },
      { name: 'Zuhr & Asr', startTime: '13:00', endTime: '14:00' },
      { name: 'Maghrib & Isha', startTime: '19:00', endTime: '20:00' },
      { name: 'Dinner', startTime: '20:00', endTime: '20:30' },
      { name: 'Sleep', startTime: '22:00', endTime: '06:00' }
    ];

    const events = [...universalDefaults];
    
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

    setTemplateEvents(events);
  };

  const getCurrentTemplateNode = () => {
    let current = templates.builtIn;
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

  const applyTemplate = async () => {
    try {
      // Add daysOfWeek to each event before sending to backend
      const eventsWithDays = templateEvents.map(event => ({
        ...event,
        daysOfWeek: selectedDaysForTemplate,
        isFixed: true
      }));
      
      console.log('=== TEMPLATE APPLICATION DEBUG ===');
      console.log('applyTemplate - selectedDaysForTemplate:', selectedDaysForTemplate);
      console.log('applyTemplate - templateEvents (before adding days):', templateEvents);
      console.log('applyTemplate - eventsWithDays (after adding days):', eventsWithDays);
      console.log('====================================');
      
      const res = await schedulerApi.applyTemplate(
        eventsWithDays, 
        selectedDaysForTemplate,
        selectedBoard,
        selectedGradeBand
      );
      if (res.success) {
        // Refresh events
        const savedEvents = await schedulerApi.getEvents();
        setLocalEvents(deduplicateEvents(savedEvents));
        if (onEventsChange) onEventsChange();
        setShowTemplatePicker(false);
        setTemplatePath([]);
        setTemplateEvents([]);
        setSelectedBoard('');
        setSelectedGradeBand('');
      }
    } catch (err) {
      console.error('Failed to apply template:', err);
      alert('Failed to apply template. Please try again.');
    }
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }
    
    try {
      const res = await schedulerApi.createTemplate(templateName, templateEvents);
      if (res.success) {
        // Refresh templates
        const data = await schedulerApi.getTemplates();
        setTemplates(data);
        setSavingTemplate(false);
        setTemplateName('');
        alert('Template saved successfully');
      }
    } catch (err) {
      console.error('Failed to save template:', err);
      alert('Failed to save template. Please try again.');
    }
  };

  const deleteCustomTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    
    try {
      await schedulerApi.deleteTemplate(id);
      const data = await schedulerApi.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to delete template:', err);
      alert('Failed to delete template. Please try again.');
    }
  };

  const updateTemplateEvent = (index, field, value) => {
    const updated = [...templateEvents];
    updated[index] = { ...updated[index], [field]: value };
    setTemplateEvents(updated);
  };

  const addTemplateEvent = () => {
    setTemplateEvents([...templateEvents, { name: '', startTime: '', endTime: '' }]);
  };

  const removeTemplateEvent = (index) => {
    setTemplateEvents(templateEvents.filter((_, i) => i !== index));
  };

  return (
    <div className="build-my-week">
      <div className="day-tabs" data-tour="day-selector">
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

      <div className="card">
        <div className="card-header" data-tour="daily-routine">
          <h2 className="card-title">Daily Routine</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="pill-button" 
              style={{ width: 'auto', padding: '8px 16px', margin: 0, fontSize: 13 }}
              onClick={() => {
                setTemplatePath([]);
                setSelectedBoard('');
                setSelectedGradeBand('');
                setShowTemplatePicker(true);
              }}
              data-tour="use-template-btn"
            >
              Use a Template
            </button>
            <button 
              className="pill-button" 
              style={{ width: 'auto', padding: '8px 16px', margin: 0, fontSize: 13 }}
              onClick={() => setShowAddForm(!showAddForm)}
              data-tour="add-event-btn"
            >
              + Add Event
            </button>
          </div>
        </div>

        {showAddForm && (
          <div style={{ 
            background: '#F9FAFB', 
            padding: 16, 
            borderRadius: 12, 
            marginBottom: 16,
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              {editingEvent ? 'Edit Event' : 'New Event'}
            </h3>
            
            {!editingEvent && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, display: 'block' }}>
                  Quick Add
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['School', 'Work', 'Sleep', 'Gym', 'Commute'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handlePreset(preset.toLowerCase())}
                      style={{
                        padding: '6px 12px',
                        background: '#FFFFFF',
                        border: '1px solid #D1D5DB',
                        borderRadius: 6,
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#F3F4F6'}
                      onMouseOut={(e) => e.target.style.background = '#FFFFFF'}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {formError && (
              <div style={{ 
                color: '#DC2626', 
                fontSize: 12, 
                marginBottom: 12,
                padding: '8px 12px',
                background: '#FEE2E2',
                borderRadius: 6
              }}>
                {formError}
              </div>
            )}
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, display: 'block' }}>
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., School, Gym, Dinner"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 6,
                  fontSize: 14
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, display: 'block' }}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, display: 'block' }}>
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, display: 'block' }}>
                Days
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DAYS.map((day) => (
                  <label key={day.value} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 4,
                    fontSize: 12,
                    color: '#374151'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.daysOfWeek.includes(day.value)}
                      onChange={() => toggleDay(day.value)}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={handleCreate}
                className="pill-button" 
                style={{ padding: '10px 20px', fontSize: 13, flex: 1 }}
              >
                Create
              </button>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setFormError('');
                }}
                className="pill-button secondary" 
                style={{ padding: '10px 20px', fontSize: 13, flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {dayEvents.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 40, 
            color: '#9CA3AF',
            fontSize: 14 
          }}>
            No events for this day. Click "+ Add Event" to create one.
          </div>
        ) : (
          dayEvents.map((event) => (
            <div key={event.id} className="time-block" style={{ position: 'relative' }}>
              <div className="time-block-icon">
                {getIconForEvent(event.title)}
              </div>
              <div className="time-block-content">
                <div className="time-block-title">{event.title}</div>
                <div className="time-block-subtitle">
                  {event.daysOfWeek.length === 7 ? 'Every day' : `${event.daysOfWeek.length} days/week`}
                </div>
              </div>
              <div className="time-block-time">
                {event.startTime} - {event.endTime}
              </div>
              {event.isFixed && <div className="time-block-lock">🔒</div>}
              <div style={{ 
                position: 'absolute', 
                right: 8, 
                top: 8, 
                display: 'flex', 
                gap: 4 
              }}>
                <button
                  onClick={() => handleEdit(event)}
                  style={{
                    padding: 4,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    opacity: 0.6,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.opacity = 1}
                  onMouseOut={(e) => e.target.style.opacity = 0.6}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(event)}
                  style={{
                    padding: 4,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    opacity: 0.6,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.opacity = 1}
                  onMouseOut={(e) => e.target.style.opacity = 0.6}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Template Picker Modal */}
      {showTemplatePicker && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            maxWidth: 600,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            padding: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                {templatePath.length === 0 ? 'Choose a Template' : 
                 templateEvents.length > 0 ? 'Edit Template' : 
                 getCurrentTemplateNode()?.label || 'Template'}
              </h2>
              <button 
                onClick={() => {
                  setShowTemplatePicker(false);
                  setTemplatePath([]);
                  setTemplateEvents([]);
                  setSelectedBoard('');
                  setSelectedGradeBand('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                ×
              </button>
            </div>

            {/* Breadcrumb navigation */}
            {templatePath.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <button 
                  onClick={navigateBack}
                  style={{
                    background: '#F3F4F6',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  ← Back
                </button>
              </div>
            )}

            {/* Template selection view */}
            {templateEvents.length === 0 && templates.builtIn && (
              <div>
                {templatePath.length === 0 ? (
                  // Top level
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {Object.entries(templates.builtIn).map(([key, value]) => (
                      <div key={key}>
                        {value.comingSoon ? (
                          <div style={{
                            padding: 16,
                            background: '#F9FAFB',
                            borderRadius: 8,
                            color: '#9CA3AF',
                            cursor: 'not-allowed'
                          }}>
                            {value.label}
                          </div>
                        ) : value.subcategories ? (
                          <button
                            onClick={() => navigateToTemplate(key)}
                            style={{
                              width: '100%',
                              padding: 16,
                              background: 'white',
                              border: '1px solid #D1D5DB',
                              borderRadius: 8,
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: 14
                            }}
                          >
                            {value.label} →
                          </button>
                        ) : (
                          <button
                            onClick={() => navigateToTemplate(key, true)}
                            style={{
                              width: '100%',
                              padding: 16,
                              background: 'white',
                              border: '1px solid #D1D5DB',
                              borderRadius: 8,
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: 14
                            }}
                          >
                            {value.label}
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Custom templates */}
                    {templates.custom.length > 0 && (
                      <div style={{ marginTop: 24 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>My Templates</h3>
                        {templates.custom.map(template => (
                          <div key={template.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 12,
                            background: 'white',
                            border: '1px solid #D1D5DB',
                            borderRadius: 8,
                            marginBottom: 8
                          }}>
                            <button
                              onClick={() => {
                                // template.events might be an object or a JSON string
                                const events = typeof template.events === 'string' 
                                  ? JSON.parse(template.events) 
                                  : template.events;
                                setTemplateEvents(events);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 14,
                                flex: 1,
                                textAlign: 'left'
                              }}
                            >
                              {template.name}
                            </button>
                            <button
                              onClick={() => deleteCustomTemplate(template.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 16,
                                padding: 4
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Subcategory level
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Board selection for MSB/Regular School */}
                    {(templatePath[0] === 'msb' || templatePath[0] === 'regular') && !selectedBoard && (
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Select Curriculum Board</h3>
                        <select
                          value={selectedBoard}
                          onChange={(e) => setSelectedBoard(e.target.value)}
                          style={{
                            width: '100%',
                            padding: 12,
                            border: '1px solid #D1D5DB',
                            borderRadius: 8,
                            fontSize: 14,
                            marginBottom: 12
                          }}
                        >
                          <option value="">Choose a board...</option>
                          {schoolBoards.boards.map(board => (
                            <option key={board} value={board}>{board}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Grade band selection after board is chosen */}
                    {(templatePath[0] === 'msb' || templatePath[0] === 'regular') && selectedBoard && !selectedGradeBand && (
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Select Grade Band</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {schoolBoards.gradeBands.map(grade => (
                            <button
                              key={grade}
                              onClick={() => {
                                setSelectedGradeBand(grade);
                                resolveTemplateToEvents(templatePath);
                              }}
                              style={{
                                width: '100%',
                                padding: 16,
                                background: 'white',
                                border: '1px solid #D1D5DB',
                                borderRadius: 8,
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontSize: 14
                              }}
                            >
                              {grade}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Regular subcategory navigation (for non-school or after board/grade) */}
                    {(!selectedBoard || selectedGradeBand) && Object.entries(getCurrentTemplateNode() || {}).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => value.subcategories ? navigateToTemplate(key) : navigateToTemplate(key, true)}
                        style={{
                          width: '100%',
                          padding: 16,
                          background: 'white',
                          border: '1px solid #D1D5DB',
                          borderRadius: 8,
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: 14
                        }}
                      >
                        {value.label} {value.subcategories ? '→' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Editable event list */}
            {templateEvents.length > 0 && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Events</h3>
                  {templateEvents.map((event, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      gap: 8,
                      marginBottom: 8,
                      alignItems: 'center'
                    }}>
                      <input
                        type="text"
                        value={event.name}
                        onChange={(e) => updateTemplateEvent(index, 'name', e.target.value)}
                        placeholder="Event name"
                        style={{
                          flex: 2,
                          padding: 8,
                          border: '1px solid #D1D5DB',
                          borderRadius: 6,
                          fontSize: 13
                        }}
                      />
                      <input
                        type="time"
                        value={event.startTime}
                        onChange={(e) => updateTemplateEvent(index, 'startTime', e.target.value)}
                        style={{
                          flex: 1,
                          padding: 8,
                          border: '1px solid #D1D5DB',
                          borderRadius: 6,
                          fontSize: 13
                        }}
                      />
                      <input
                        type="time"
                        value={event.endTime}
                        onChange={(e) => updateTemplateEvent(index, 'endTime', e.target.value)}
                        style={{
                          flex: 1,
                          padding: 8,
                          border: '1px solid #D1D5DB',
                          borderRadius: 6,
                          fontSize: 13
                        }}
                      />
                      <button
                        onClick={() => removeTemplateEvent(index)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 16,
                          padding: 4
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addTemplateEvent}
                    style={{
                      marginTop: 8,
                      padding: '8px 12px',
                      background: '#F3F4F6',
                      border: '1px solid #D1D5DB',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13
                    }}
                  >
                    + Add Event
                  </button>
                </div>

                {/* Day selector */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Apply to Days</h3>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>
                      {selectedDaysForTemplate.length} of 7 days selected
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    {DAYS.map((day) => (
                      <label key={day.value} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 13
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedDaysForTemplate.includes(day.value)}
                          onChange={() => {
                            setSelectedDaysForTemplate(
                              selectedDaysForTemplate.includes(day.value)
                                ? selectedDaysForTemplate.filter(d => d !== day.value)
                                : [...selectedDaysForTemplate, day.value]
                            );
                          }}
                        />
                        {day.label}
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = selectedDaysForTemplate.length === 7;
                        setSelectedDaysForTemplate(allSelected ? [] : [0, 1, 2, 3, 4, 5, 6]);
                      }}
                      className="pill-button secondary"
                      style={{ 
                        padding: '4px 12px', 
                        fontSize: 12,
                        marginLeft: 8
                      }}
                    >
                      {selectedDaysForTemplate.length === 7 ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={applyTemplate}
                    className="pill-button"
                    style={{ padding: '12px 20px', fontSize: 14 }}
                  >
                    Apply to Selected Days
                  </button>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!savingTemplate ? (
                      <button
                        onClick={() => setSavingTemplate(true)}
                        className="pill-button secondary"
                        style={{ padding: '12px 20px', fontSize: 14, flex: 1 }}
                      >
                        Save as My Template
                      </button>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="Template name"
                          style={{
                            flex: 1,
                            padding: '12px',
                            border: '1px solid #D1D5DB',
                            borderRadius: 6,
                            fontSize: 14
                          }}
                        />
                        <button
                          onClick={saveAsTemplate}
                          className="pill-button"
                          style={{ padding: '12px 20px', fontSize: 14 }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setSavingTemplate(false);
                            setTemplateName('');
                          }}
                          className="pill-button secondary"
                          style={{ padding: '12px 20px', fontSize: 14 }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <button className="pill-button" onClick={onNext}>
        Next: Exceptions
      </button>
      
      <button className="pill-button secondary" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
