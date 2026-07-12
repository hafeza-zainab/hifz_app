// features/coach/CoachPage.jsx
//
// State machine-based coach page following the detailed workflow document
// Uses deterministic state transitions instead of AI-driven conversation flow

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { injectCoachStyles, authFetch } from "../coachConstants";
import { useCoachStateMachine } from "../hooks/useCoachStateMachine";
import { COACH_STATES } from "../coachStates";
import { useTour } from "../../../shared/context/TourContext";

// Module screens
import {
  SequenceHome,
  SequenceModeSelect,
  SequenceInput,
} from "../components/sequence/SequenceScreens";

import {
  MutashabihatHome,
  MutashabihatSearch,
  MutashabihatPairInput,
  MutashabihatAllPairs,
} from "../components/MutashabihatScreens";

import {
  AssessmentCheck,
  ProfileInput,
} from "../components/BestMethodScreens";

import SchedulerWizard from "../../scheduler/SchedulerWizard";
import SensoryAssessmentModal from "../components/sensory/SensoryAssessmentModal";

export default function CoachPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isActive, currentStep, dispatchTourEvent } = useTour();
  
  // ── State machine ───────────────────────────────────────────────────────────
  const {
    currentState,
    stateData,
    loading,
    error,
    setError,
    goToHome,
    handleSequenceOption,
    handleSequenceMode,
    handleSequenceInput,
    handleMutashabihatOption,
    handleMutashabihatSearch,
    handleMutashabihatPairTip,
    handleMutashabihatAllTips,
    handleAssessmentCheck,
    handleProfileInput,
  } = useCoachStateMachine();

  // ── Sensory Assessment Modal ───────────────────────────────────────────────────
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  const handleTakeTest = () => {
    setShowAssessmentModal(true);
  };

  const handleProfileSaved = (newProfile) => {
    setShowAssessmentModal(false);
  };

  useEffect(() => {
  injectCoachStyles();
}, [location.search]);

  // ── Render current state screen ───────────────────────────────────────────────
  const renderCurrentScreen = () => {
    switch (currentState) {
      // SEQUENCE states
      case COACH_STATES.SEQUENCE_HOME:
        return <SequenceHome onSelect={(key) => key === 'back' ? goToHome() : handleSequenceOption(key)} />;
      case COACH_STATES.SEQUENCE_SURAH_MODE:
      case COACH_STATES.SEQUENCE_PAGE_MODE:
      case COACH_STATES.SEQUENCE_JUZ_PAGE_MODE:
        return <SequenceModeSelect onSelect={(mode) => mode === 'back' ? goToHome() : handleSequenceMode(mode)} />;
      case COACH_STATES.SEQUENCE_SURAH_INPUT:
        return <SequenceInput onSubmit={handleSequenceInput} onBack={goToHome} placeholder="e.g., 36" title="Enter Surah Number or Name" />;
      case COACH_STATES.SEQUENCE_PAGE_INPUT:
        return <SequenceInput onSubmit={handleSequenceInput} onBack={goToHome} placeholder="e.g., 250" title="Enter Page Number" />;
      case COACH_STATES.SEQUENCE_JUZ_PAGE_INPUT:
        return <SequenceInput onSubmit={handleSequenceInput} onBack={goToHome} placeholder="e.g., 10" title="Enter Juz Number" />;
      case COACH_STATES.SEQUENCE_JUZ_SURAH_INPUT:
        return <SequenceInput onSubmit={handleSequenceInput} onBack={goToHome} placeholder="e.g., 30" title="Enter Juz Number" />;

      // MUTASHABIHAT states
      case COACH_STATES.MUTASHABIHAT_HOME:
        return <MutashabihatHome onSelect={(key) => key === 'back' ? goToHome() : handleMutashabihatOption(key)} savedTips={[]} />;
      case COACH_STATES.MUTASHABIHAT_SEARCH_SURAH:
        return <MutashabihatSearch onSurahSubmit={handleMutashabihatSearch} onBack={goToHome} />;
      case COACH_STATES.MUTASHABIHAT_PAIR_A_SURAH:
        return <MutashabihatPairInput onSubmit={handleMutashabihatPairTip} onBack={goToHome} />;
      case COACH_STATES.MUTASHABIHAT_ALL_PAIRS_SURAH:
        return <MutashabihatAllPairs onSubmit={handleMutashabihatAllTips} onBack={goToHome} />;

      // BEST METHOD states
      case COACH_STATES.STYLE_ASSESSMENT_CHECK:
        return <AssessmentCheck onSelect={(hasCompleted) => hasCompleted === 'back' ? goToHome() : handleAssessmentCheck(hasCompleted)} />;
      case COACH_STATES.STYLE_PROFILE_INPUT:
        return <ProfileInput onSubmit={handleProfileInput} onBack={goToHome} saved={stateData.saved} profile={stateData.profile} existingProfile={stateData.existingProfile} />;

      // TIME MANAGEMENT states
      case COACH_STATES.TIME_MANAGEMENT_START:
        return <SchedulerWizard onBack={goToHome} onTakeTest={handleTakeTest} />;

      default:
        return <SchedulerWizard onBack={goToHome} />;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", height: "100%", minHeight: 520,
      background: "white", borderRadius: 16,
      border: "1px solid #E5E7EB", overflow: "hidden",
      boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
    }}>
      {/* ── Centre: main content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Main content area */}
        <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
          {error && (
            <div style={{
              padding: "12px 16px", background: "#FEF2F2",
              borderBottom: "1px solid #FECACA", color: "#991B1B",
              fontSize: 13,
            }}>
              {error}
              <button onClick={() => setError(null)} style={{ marginLeft: 12, background: "none", border: "none", color: "#991B1B", cursor: "pointer", fontSize: 12 }}>
                ✕
              </button>
            </div>
          )}
          
          {loading ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: "100%", fontSize: 14, color: "#6B7280",
            }}>
              Loading...
            </div>
          ) : (
            renderCurrentScreen()
          )}
        </div>
      </div>

      {/* Sensory Assessment Modal */}
      {showAssessmentModal && (
        <SensoryAssessmentModal
          onClose={() => setShowAssessmentModal(false)}
          onProfileSaved={handleProfileSaved}
        />
      )}
    </div>
  );
}