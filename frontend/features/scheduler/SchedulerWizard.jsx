//C:\quran-similarity-app\frontend\src\features\scheduler\SchedulerWizard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { schedulerApi } from './services/schedulerApi';
import { authFetch } from '../../shared/services/http';
import { useTour } from '../../shared/context/TourContext';
import { deduplicateEvents } from './utils/eventDedup';
import './SchedulerWizard.css';

// Screen components
import ProgressAnalysis from './wizard/ProgressAnalysis';
import WeeklyCycle from './wizard/WeeklyCycle';
import GeneratedSchedule from './wizard/GeneratedSchedule';

const STEPS = {
  PROGRESS_ANALYSIS: 1,
  WEEKLY_CYCLE: 2,
  GENERATED_SCHEDULE: 3
};

const TOTAL_STEPS = Object.keys(STEPS).length;

export default function SchedulerWizard({ onBack, onTakeTest }) {
  const navigate = useNavigate();
  const { isActive, dispatchTourEvent } = useTour();
  const [currentStep, setCurrentStep] = useState(STEPS.PROGRESS_ANALYSIS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Wizard data
  const [analysis, setAnalysis] = useState(null);
  const [weeklyCycle, setWeeklyCycle] = useState(null);
  const [events, setEvents] = useState([]);
  const [exceptions, setExceptions] = useState(() => {
    // Load exceptions from localStorage on mount
    try {
      const saved = localStorage.getItem('scheduler_exceptions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [schedule, setSchedule] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  // Save exceptions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('scheduler_exceptions', JSON.stringify(exceptions));
  }, [exceptions]);

  useEffect(() => {
    loadProgressAnalysis();
  }, []);

  const loadProgressAnalysis = async () => {
    try {
      setLoading(true);
      // Call the actual progress analysis API
      const analysisJson = await authFetch('/coach/wizard/tm/analyze', {
        method: 'POST',
        body: JSON.stringify({ useCurrentLogs: true }),
      }, 'loadProgressAnalysis');
      
      if (analysisJson?.success && analysisJson?.data) {
        setAnalysis(analysisJson.data);
      } else {
        setError('Failed to load analysis data');
      }
    } catch (err) {
      console.error('Failed to load progress analysis:', err);
      setError('Failed to analyze logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyCycle = async () => {
    try {
      setLoading(true);
      // Call the actual weekly cycle API
      const cycleJson = await authFetch('/coach/wizard/tm/cycle', {
        method: 'POST',
        body: JSON.stringify({ analysisData: analysis }),
      }, 'loadWeeklyCycle');
      
      console.log('=== WEEKLY CYCLE API RESPONSE ===');
      console.log('loadWeeklyCycle - cycleJson:', cycleJson);
      console.log('loadWeeklyCycle - cycleJson.data:', cycleJson?.data);
      console.log('loadWeeklyCycle - data type:', typeof cycleJson?.data);
      console.log('loadWeeklyCycle - data isArray:', Array.isArray(cycleJson?.data));
      console.log('loadWeeklyCycle - data keys:', cycleJson?.data ? Object.keys(cycleJson.data) : 'N/A');
      console.log('====================================');
      
      if (cycleJson?.success && cycleJson?.data) {
        setWeeklyCycle(cycleJson.data);
      } else {
        setError('Failed to load weekly cycle');
      }
    } catch (err) {
      console.error('Failed to load weekly cycle:', err);
      setError('Failed to generate weekly cycle');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const data = await schedulerApi.getEvents();
      setEvents(deduplicateEvents(data));
    } catch (err) {
      setError('Failed to load events');
    }
  };

  const generateSchedule = async () => {
    try {
      setLoading(true);
      const scheduleData = await schedulerApi.generateSchedule({
        events,
        exceptions,
        progressAnalysis: analysis,
        weeklyCycle
      });
      setSchedule(scheduleData);
    } catch (err) {
      console.error('Generate schedule error:', err);
      setError('Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoutine = () => {
    setCurrentStep(STEPS.GENERATED_SCHEDULE);
  };

  const handleNext = () => {
    // Dispatch tour event for auto-advance
    if (isActive) {
      dispatchTourEvent('coach:continue');
    }
    
    if (currentStep === STEPS.PROGRESS_ANALYSIS) {
      loadWeeklyCycle();
      setCurrentStep(STEPS.WEEKLY_CYCLE);
    } else if (currentStep === STEPS.WEEKLY_CYCLE) {
      loadEvents();
      generateSchedule();
      setCurrentStep(STEPS.GENERATED_SCHEDULE);
    }
  };

  const handleBack = () => {
    if (currentStep === STEPS.PROGRESS_ANALYSIS) {
      navigate(-1);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSelectUnit = (unit) => {
    setSelectedUnit(unit);
    // Unit details are now shown inline in GeneratedSchedule, not as a separate step
  };

  if (loading) {
    return (
      <div className="scheduler-wizard loading">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scheduler-wizard error">
        <div className="error-message">{error}</div>
        <button onClick={handleBack}>Back</button>
      </div>
    );
  }

  return (
    <div className="scheduler-wizard">
      <div className="wizard-header">
        {currentStep !== STEPS.PROGRESS_ANALYSIS && (
          <button className="back-btn" onClick={handleBack}>
            ← Back
          </button>
        )}
        <div className="step-indicator">
          Step {currentStep} of {TOTAL_STEPS}
        </div>
        {currentStep === STEPS.PROGRESS_ANALYSIS && onTakeTest && (
          <button
            onClick={onTakeTest}
            data-tour="take-test-button"
            style={{
              padding: "6px 12px",
              background: "#004D40",
              border: "1px solid #004D40",
              borderRadius: 6,
              color: "white",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Take Test
          </button>
        )}
      </div>

      <div className="wizard-content">
        {currentStep === STEPS.PROGRESS_ANALYSIS && (
          <ProgressAnalysis analysis={analysis} onNext={handleNext} />
        )}

        {currentStep === STEPS.WEEKLY_CYCLE && (
          <WeeklyCycle weeklyCycle={weeklyCycle} onNext={handleNext} onBack={handleBack} />
        )}

        {currentStep === STEPS.GENERATED_SCHEDULE && (
          <GeneratedSchedule 
            schedule={schedule} 
            weeklyCycle={weeklyCycle}
            events={events}
            exceptions={exceptions}
            onEventsChange={loadEvents}
            onExceptionsChange={setExceptions}
            onSelectUnit={handleSelectUnit}
            onBack={handleBack} 
          />
        )}
      </div>
    </div>
  );
}
