// frontend/src/features/similarity/components/MutashabihatWizard.jsx
// Wizard-based Mutashabihat interface with frontend-owned state machine

import React, { useState } from 'react';
import { authFetch } from '../../../shared/services/http';

// Wizard states (frontend-owned)
const WIZARD_STATES = {
  MENU: 'mut_menu',
  FIND_SURAH: 'mut_find_surah',
  FIND_AYAH: 'mut_find_ayah',
  FIND_RESULTS: 'mut_results',
  PAIR_A: 'mut_pair_a',
  PAIR_B: 'mut_pair_b',
  PAIR_SAVE: 'mut_pair_save',
};

export default function MutashabihatWizard() {
  const [currentState, setCurrentState] = useState(WIZARD_STATES.MENU);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data
  const [surah, setSurah] = useState('');
  const [ayah, setAyah] = useState('');
  const [targetSurah, setTargetSurah] = useState('');
  const [targetAyah, setTargetAyah] = useState('');
  
  // Results
  const [findResults, setFindResults] = useState(null);

  // API calls
  const findMutashabihat = async (surahNum, ayahNum) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/similarity/wizard/find', {
        method: 'POST',
        body: JSON.stringify({ surah: surahNum, ayah: ayahNum }),
      }, 'findMutashabihat');
      setFindResults(res.data);
      setCurrentState(WIZARD_STATES.FIND_RESULTS);
    } catch (err) {
      console.error('[MutashabihatWizard] Failed to find similar verses for:', `${surahNum}:${ayahNum}`, err);
      setError('Failed to find similar verses');
    } finally {
      setLoading(false);
    }
  };

  const savePair = async (ss, sa, ts, ta) => {
    setLoading(true);
    setError(null);
    try {
      await authFetch('/similarity/wizard/pair/save', {
        method: 'POST',
        body: JSON.stringify({ source_surah: ss, source_ayah: sa, target_surah: ts, target_ayah: ta }),
      }, 'savePair');
      // AI tip generation disabled - no longer auto-generate tips
      setCurrentState(WIZARD_STATES.PAIR_SAVE);
    } catch (err) {
      console.error('[MutashabihatWizard] Failed to save pair:', `${ss}:${sa} → ${ts}:${ta}`, err);
      setError('Failed to save pair');
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setCurrentState(WIZARD_STATES.MENU);
    setSurah('');
    setAyah('');
    setTargetSurah('');
    setTargetAyah('');
    setFindResults(null);
    setError(null);
  };

  // Render based on state
  const renderContent = () => {
    switch (currentState) {
      case WIZARD_STATES.MENU:
        return (
          <div className="wizard-menu">
            <h2>🤖 What would you like?</h2>
            <div className="wizard-options">
              <button onClick={() => setCurrentState(WIZARD_STATES.FIND_SURAH)}>
                1. Find Mutashabihat
              </button>
              <button onClick={() => setCurrentState(WIZARD_STATES.PAIR_A)}>
                2. Help me remember a Pair
              </button>
            </div>
          </div>
        );

      case WIZARD_STATES.FIND_SURAH:
        return (
          <div className="wizard-step">
            <h3>Enter Surah Number</h3>
            <input
              type="number"
              value={surah}
              onChange={(e) => setSurah(e.target.value)}
              placeholder="e.g., 2"
            />
            <button onClick={() => setCurrentState(WIZARD_STATES.FIND_AYAH)}>
              Next
            </button>
            <button onClick={() => setCurrentState(WIZARD_STATES.MENU)}>
              Back
            </button>
          </div>
        );

      case WIZARD_STATES.FIND_AYAH:
        return (
          <div className="wizard-step">
            <h3>Enter Ayah Number</h3>
            <input
              type="number"
              value={ayah}
              onChange={(e) => setAyah(e.target.value)}
              placeholder="e.g., 255"
            />
            <button onClick={() => findMutashabihat(surah, ayah)}>
              Find
            </button>
            <button onClick={() => setCurrentState(WIZARD_STATES.FIND_SURAH)}>
              Back
            </button>
          </div>
        );

      case WIZARD_STATES.FIND_RESULTS:
        return (
          <div className="wizard-results">
            <h3>Matches Found</h3>
            {findResults?.results?.map((result, index) => (
              <div key={index} className="result-item">
                {index + 1}. Surah {result.target_surah} : Ayah {result.target_ayah}
              </div>
            ))}
            <p>No tips generated.</p>
            <p>No side panel update.</p>
            <button onClick={resetWizard}>
              Done
            </button>
          </div>
        );

      case WIZARD_STATES.PAIR_A:
        return (
          <div className="wizard-step">
            <h3>Enter the first verse</h3>
            <label>A - Surah:</label>
            <input
              type="number"
              value={surah}
              onChange={(e) => setSurah(e.target.value)}
              placeholder="e.g., 2"
            />
            <label>Ayah:</label>
            <input
              type="number"
              value={ayah}
              onChange={(e) => setAyah(e.target.value)}
              placeholder="e.g., 255"
            />
            <button onClick={() => setCurrentState(WIZARD_STATES.PAIR_B)}>
              Next
            </button>
            <button onClick={() => setCurrentState(WIZARD_STATES.MENU)}>
              Back
            </button>
          </div>
        );

      case WIZARD_STATES.PAIR_B:
        return (
          <div className="wizard-step">
            <h3>Enter the second verse</h3>
            <label>B - Surah:</label>
            <input
              type="number"
              value={targetSurah}
              onChange={(e) => setTargetSurah(e.target.value)}
              placeholder="e.g., 3"
            />
            <label>Ayah:</label>
            <input
              type="number"
              value={targetAyah}
              onChange={(e) => setTargetAyah(e.target.value)}
              placeholder="e.g., 2"
            />
            <button onClick={() => savePair(surah, ayah, targetSurah, targetAyah)}>
              Save Pair
            </button>
            <button onClick={() => setCurrentState(WIZARD_STATES.PAIR_A)}>
              Back
            </button>
          </div>
        );

      case WIZARD_STATES.PAIR_SAVE:
        return (
          <div className="wizard-results">
            <h3>Pair Saved</h3>
            <p>{surah}:{ayah} ↔ {targetSurah}:{targetAyah}</p>
            <p>Pair saved successfully.</p>
            <p>To add a tip, use the manual edit tips feature.</p>
            <button onClick={resetWizard}>
              Done
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mutashabihat-wizard">
      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading-message">Loading...</div>}
      {renderContent()}
    </div>
  );
}
