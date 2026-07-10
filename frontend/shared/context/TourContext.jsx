/**
 * Tour Context
 * Purpose: Manages interactive onboarding tour state and step progression
 * Features: 32-step tour, event-driven auto-advance, localStorage persistence
 */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';

const TourContext = createContext();

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

export const TourProvider = ({ children }) => {
  const navigateRef = useRef(null);
  const currentStepRef = useRef(0);
  const isActiveRef = useRef(false);
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Tour steps with page assignments - memoized to prevent recreation
  const tourSteps = useMemo(() => [
    { step: 1, page: '/similarity', trigger: 'manual', content: "Welcome to the Mutashābihāt tool. Find structurally similar verses that are easy to confuse.", targetSelector: null },
    { step: 2, page: '/similarity', trigger: 'manual', content: "Use this dropdown to filter by your memorisation stage. Try switching it now!", targetSelector: '[data-tour="similarity-filter-dropdown"]' },
    { step: 3, page: '/similarity', trigger: 'action', triggerEvent: 'similarity:searched', content: "Enter any Surah and Ayah number, then click 'Find Similarities'. Try it now!", targetSelector: '[data-tour="similarity-search-form"]' },
    { step: 4, page: '/similarity', trigger: 'action', triggerEvent: 'similarity:result:selected', content: "Click on any result in the list to open its details in the side panel.", targetSelector: '[data-tour="similarity-results-list"]' },
    { step: 5, page: '/similarity', trigger: 'manual', content: "Mutashabiha Score 0–100: higher = more confusable. Scores above 70 need careful attention.", targetSelector: '[data-tour="similarity-score-badge"]' },
    { step: 6, page: '/similarity', trigger: 'action', triggerEvent: 'tip:edit:opened', content: "Click the ✏️ edit icon on the Memory Tip to personalise it.", targetSelector: '[data-tour="tip-edit-icon"]' },
    { step: 7, page: '/similarity', trigger: 'manual', content: "Every pair is bidirectional — Verse A ↔ Verse B. You'll always see both sides.", targetSelector: '[data-tour="side-panel-header"]' },
    { step: 8, page: '/flashcards', trigger: 'manual', content: "4 flashcard types: Ayah in Surah, Ayah in Page, Pages in Juz, Surahs in Juz.", targetSelector: '[data-tour="flashcard-type-selector"]' },
    { step: 9, page: '/flashcards', trigger: 'action', triggerEvent: 'flashcard:created', content: "Click '+ Create Flashcard Set', configure it, and click Generate.", targetSelector: '[data-tour="create-flashcard-button"]', expandedTargetSelector: '[data-tour="flashcard-type-modal"]' },
    { step: 10, page: '/flashcards', trigger: 'action', triggerEvent: 'flashcard:opened', content: "Click on your new flashcard set from the list to open it.", targetSelector: '[data-tour="flashcard-set-list"]' },
    { step: 11, page: '/flashcards', trigger: 'manual', content: "You can see the Memory Aid flowchart and Study questions here. The Memory Aid shows a visual flowchart of Ayah connections to help you see the sequence and relationships between verses.", targetSelector: '[data-tour="flashcard-study-view"]' },
    { step: 12, page: '/flashcards', trigger: 'action', triggerEvent: 'flashcard:test:opened', content: "Click the 'Test Yourself' tab to see how it works.", targetSelector: '[data-tour="test-yourself-tab"]' },
    { step: 13, page: '/flashcards', trigger: 'manual', content: "✏️ Pencil icon = rename the set. 'Delete Set' button = delete it when the set is open.", targetSelector: '[data-tour="flashcard-actions"]' },
    { step: 14, page: '/flashcards', trigger: 'action', triggerEvent: 'folder:created', content: "Click '+ New Folder' to create a folder. Type a name and press Enter.", targetSelector: '[data-tour="new-folder-button"]', expandedTargetSelector: '[data-tour="folder-name-input"]' },
    { step: 15, page: '/flashcards', trigger: 'action', triggerEvent: 'folder:item:added', content: "Click a folder to open it, then click '+ Add Sets to Folder'. Select sets and click Add.", targetSelector: '[data-tour="folder-card"]', expandedTargetSelector: ['[data-tour="add-sets-to-folder-button"]', '[data-tour="add-sets-selection-panel"]'] },
    { step: 16, page: '/flashcards', trigger: 'manual', content: "Built-in Categories are always on the left sidebar — Surah Openings, Verses Twice, Mnemonics & more.", targetSelector: '[data-tour="built-in-categories"]' },
    { step: 17, page: '/diary', trigger: 'manual', content: "This is your Hifz Diary with 5 entry types: MURAJAH (revision), TASMEE (recitation), IKHTEBAR (testing), JADEED (new memorisation), JUZ HALI (Juz completion). Try filling one entry.", targetSelector: '[data-tour="diary-entry-types"]' },
    { step: 18, page: '/diary', trigger: 'action', triggerEvent: 'diary:entry:added', content: "Select an entry type, fill in the details, and click Save. MURAJAH for revision, TASMEE for recitation, IKHTEBAR for testing, JADEED for new memorisation, JUZ HALI for Juz completion.", targetSelector: '[data-tour="diary-save-button"]' },
    { step: 19, page: '/diary', trigger: 'manual', content: "🔥 Log any entry daily to grow your streak. Miss a day = streak freezes (not reset).", targetSelector: '[data-tour="streak-flame"]' },
    { step: 20, page: '/diary', trigger: 'manual', content: "🗺️ Qur'an Map: green pages are strong (7-10), orange are fair (3-6), red need urgent revision (1-2). Updates as you log entries.", targetSelector: '[data-tour="quran-map"]' },
    { step: 21, page: '/diary', trigger: 'manual', content: "Every entry you log is saved to your diary timeline. Track your hifz progress over time.", targetSelector: '[data-tour="diary-timeline"]' },
    { step: 22, page: '/coach', trigger: 'action', triggerEvent: 'coach:continue', content: "📊 Review your Progress Overview (completed Siparas, current page, scores) and Weekly Cycle (study days per week), then click Continue to build your schedule.", targetSelector: '[data-tour="coach-continue-button"]' },
    { step: 23, page: '/coach', trigger: 'manual', content: "🗓️ This is your Week View schedule. Select a template to auto-fill events, or click empty slots to add events manually like Google Calendar.", targetSelector: '[data-tour="select-template-button"]' },
    { step: 24, page: '/coach', trigger: 'manual', content: "✏️ Click any empty time slot to add an event. Drag events to reschedule them. Use Reset to restore template defaults.", targetSelector: '[data-tour="week-view-grid"]' },
    { step: 25, page: '/coach', trigger: 'manual', content: "✅ Your Hifz schedule is ready! You can print or download it from the toolbar. Click 'Take Test' in the header to retake your Sensory Profile assessment.", targetSelector: '[data-tour="take-test-button"]' },
    { step: 26, page: '/', trigger: 'manual', content: "🎉 Tour complete! You're all set to start your Hifz journey. May Allah make it easy for you. آمين", targetSelector: null },
  ], []);

  // Check localStorage on mount
  useEffect(() => {
    const tourCompleted = localStorage.getItem('hifz_tour_completed') === 'true';
    if (tourCompleted) {
      setIsActive(false);
    }
  }, []);

  // Navigate to current step's page when tour becomes active
  useEffect(() => {
    if (isActive && currentStep > 0 && tourSteps[currentStep - 1]?.page && navigateRef.current) {
      navigateRef.current(tourSteps[currentStep - 1].page);
    }
  }, [isActive, currentStep]);

  // Keep refs in sync with state to avoid stale closures
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const startTour = () => {
    console.log('[TourContext] Starting tour');
    // Log all tour steps for debugging
    tourSteps.forEach((s, i) => console.log(`Step ${i+1}: page=${s.page} trigger=${s.trigger} content=${s.content.substring(0, 50)}...`));
    setCurrentStep(1);
    currentStepRef.current = 1;
    setCompletedSteps([]);
    setIsActive(true);
    // Navigate to first step's page
    const firstStep = tourSteps[0];
    if (firstStep?.page && navigateRef.current) {
      navigateRef.current(firstStep.page);
    }
  };

  const advanceStep = useCallback(() => {
    const nextStepIndex = currentStepRef.current + 1;
    const nextStepData = tourSteps[nextStepIndex - 1];
    const currentStepData = tourSteps[currentStepRef.current - 1];

    console.log('[TourContext] Advancing from step', currentStepRef.current, 'to', nextStepIndex);

    // If next step is on a different page, navigate there first
    if (nextStepData && currentStepData && nextStepData.page !== currentStepData.page) {
      console.log('[TourContext] Navigating to', nextStepData.page);
      if (navigateRef.current) {
        navigateRef.current(nextStepData.page);
        // Delay for page to mount before incrementing step
        setTimeout(() => {
          setCompletedSteps(prev => [...prev, currentStepRef.current]);
          setCurrentStep(nextStepIndex);
          currentStepRef.current = nextStepIndex;
        }, 400);
      }
    } else {
      setCompletedSteps(prev => [...prev, currentStepRef.current]);
      setCurrentStep(nextStepIndex);
      currentStepRef.current = nextStepIndex;
    }
  }, [tourSteps]);

  const goToPreviousStep = useCallback(() => {
    const prevStepIndex = currentStepRef.current - 1;
    
    if (prevStepIndex < 1) {
      console.log('[TourContext] Already at step 1, cannot go back');
      return;
    }

    const prevStepData = tourSteps[prevStepIndex - 1];
    const currentStepData = tourSteps[currentStepRef.current - 1];

    console.log('[TourContext] Going back from step', currentStepRef.current, 'to', prevStepIndex);

    // If previous step is on a different page, navigate there first
    if (prevStepData && currentStepData && prevStepData.page !== currentStepData.page) {
      console.log('[TourContext] Navigating to', prevStepData.page);
      if (navigateRef.current) {
        navigateRef.current(prevStepData.page);
        // Delay for page to mount before decrementing step
        setTimeout(() => {
          setCompletedSteps(prev => prev.filter(s => s !== prevStepIndex));
          setCurrentStep(prevStepIndex);
          currentStepRef.current = prevStepIndex;
        }, 400);
      }
    } else {
      setCompletedSteps(prev => prev.filter(s => s !== prevStepIndex));
      setCurrentStep(prevStepIndex);
      currentStepRef.current = prevStepIndex;
    }
  }, [tourSteps]);

  // Event system for action-triggered steps
  const dispatchTourEvent = useCallback((eventName) => {
    try {
      const currentStepData = tourSteps[currentStepRef.current - 1];
      console.log('[TourContext] Event dispatched:', eventName, 'Current step:', currentStepRef.current, 'Expected:', currentStepData?.triggerEvent);
      
      if (
        isActiveRef.current &&
        currentStepData?.trigger === 'action' &&
        currentStepData?.triggerEvent === eventName
      ) {
        console.log('[TourContext] Action matched, auto-advancing after 600ms');
        // Auto-advance after brief delay so user sees their action completed
        setTimeout(() => {
          advanceStep();
        }, 600);
      }
    } catch (error) {
      console.error('[TourContext] Error in dispatchTourEvent:', error);
    }
  }, [tourSteps, advanceStep]);

  const registerNavigate = (fn) => {
    navigateRef.current = fn;
  };

  const goToStep = (step) => {
    console.log('[TourContext] Going to step', step);
    setCurrentStep(step);
  };

  const exitTour = () => {
    console.log('[TourContext] Exiting tour');
    setIsActive(false);
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  const completeTour = async () => {
    console.log('[TourContext] Completing tour');
    localStorage.setItem('hifz_tour_completed', 'true');
    setIsActive(false);
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  // Step detection callbacks for auto-advance (backward compatibility)
  const onResultsFound = useCallback(() => {
    console.log('[TourContext] onResultsFound called - currentStep:', currentStepRef.current);
    dispatchTourEvent('similarity:searched');
  }, [dispatchTourEvent]);

  const onResultClicked = useCallback(() => {
    console.log('[TourContext] onResultClicked called - currentStep:', currentStepRef.current);
    dispatchTourEvent('similarity:result:selected');
  }, [dispatchTourEvent]);

  const onModalOpened = useCallback(() => {
    console.log('[TourContext] onModalOpened called - currentStep:', currentStepRef.current);
    // No specific event for modal opened in new system
  }, []);

  const onSetCreated = useCallback(() => {
    console.log('[TourContext] onSetCreated called - currentStep:', currentStepRef.current);
    dispatchTourEvent('flashcard:created');
  }, [dispatchTourEvent]);

  const onSetOpened = useCallback(() => {
    console.log('[TourContext] onSetOpened called - currentStep:', currentStepRef.current);
    dispatchTourEvent('flashcard:opened');
  }, [dispatchTourEvent]);

  // Log state changes
  useEffect(() => {
    console.log('[TourContext] State changed:', { isActive, currentStep, completedSteps });
  }, [isActive, currentStep, completedSteps]);

  const value = {
    isActive,
    currentStep,
    completedSteps,
    tourSteps,
    startTour,
    advanceStep,
    goToPreviousStep,
    goToStep,
    exitTour,
    completeTour,
    registerNavigate,
    dispatchTourEvent,
    // Backward compatibility callbacks
    onResultsFound,
    onResultClicked,
    onModalOpened,
    onSetCreated,
    onSetOpened,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};
