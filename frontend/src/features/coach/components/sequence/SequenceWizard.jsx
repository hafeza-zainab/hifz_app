// frontend/src/features/coach/components/SequenceWizard.jsx
// Deterministic Quran sequence traversal wizard with frontend-owned state machine
// STRICT: No LLM control over UI, navigation, or traversal logic

import React, { useState } from 'react';
import { authFetch } from '../../../../shared/services/http';

// Wizard states (frontend-owned - exact specification)
const SEQ_STATES = {
  MENU: 'seq_menu',
  SURAH_MODE: 'seq_surah_mode',
  SURAH_INPUT: 'seq_surah_input',
  SURAH_OUTPUT: 'seq_surah_output',
  PAGE_MODE: 'seq_page_mode',
  PAGE_INPUT: 'seq_page_input',
  PAGE_OUTPUT: 'seq_page_output',
  JUZ_PAGES_MODE: 'seq_juz_pages_mode',
  JUZ_PAGES_INPUT: 'seq_juz_pages_input',
  JUZ_PAGES_OUTPUT: 'seq_juz_pages_output',
  JUZ_SURAH_INPUT: 'seq_juz_surah_input',
  JUZ_SURAH_OUTPUT: 'seq_juz_surah_output',
};

export default function SequenceWizard() {
  const [currentState, setCurrentState] = useState(SEQ_STATES.MENU);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data
  const [mode, setMode] = useState(null); // 'starting' or 'ending'
  const [surah, setSurah] = useState('');
  const [page, setPage] = useState('');
  const [juz, setJuz] = useState('');
  
  // Results
  const [sequenceResults, setSequenceResults] = useState(null);

  // API calls (backend-only traversal logic)
  const getSurahSequence = async (surahNum, outputMode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/coach/wizard/sequence/surah', {
        method: 'POST',
        body: JSON.stringify({ surah: surahNum, mode: outputMode }),
      }, 'getSurahSequence');
      setSequenceResults(res.data);
      setCurrentState(SEQ_STATES.SURAH_OUTPUT);
    } catch (err) {
      console.error('[SequenceWizard] Failed to fetch surah sequence for:', surahNum, err);
      setError('Failed to fetch surah sequence');
    } finally {
      setLoading(false);
    }
  };

  const getPageSequence = async (pageNum, outputMode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/coach/wizard/sequence/page', {
        method: 'POST',
        body: JSON.stringify({ page: pageNum, mode: outputMode }),
      }, 'getPageSequence');
      setSequenceResults(res.data);
      setCurrentState(SEQ_STATES.PAGE_OUTPUT);
    } catch (err) {
      console.error('[SequenceWizard] Failed to fetch page sequence for:', pageNum, err);
      setError('Failed to fetch page sequence');
    } finally {
      setLoading(false);
    }
  };

  const getJuzPagesSequence = async (juzNum, outputMode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/coach/wizard/sequence/juz-pages', {
        method: 'POST',
        body: JSON.stringify({ juz: juzNum, mode: outputMode }),
      }, 'getJuzPagesSequence');
      setSequenceResults(res.data);
      setCurrentState(SEQ_STATES.JUZ_PAGES_OUTPUT);
    } catch (err) {
      console.error('[SequenceWizard] Failed to fetch juz pages sequence for:', juzNum, err);
      setError('Failed to fetch juz pages sequence');
    } finally {
      setLoading(false);
    }
  };

  const getJuzSurahSequence = async (juzNum) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/coach/wizard/sequence/juz-surahs', {
        method: 'POST',
        body: JSON.stringify({ juz: juzNum }),
      }, 'getJuzSurahSequence');
      setSequenceResults(res.data);
      setCurrentState(SEQ_STATES.JUZ_SURAH_OUTPUT);
    } catch (err) {
      console.error('[SequenceWizard] Failed to fetch juz surah sequence for:', juzNum, err);
      setError('Failed to fetch juz surah sequence');
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setCurrentState(SEQ_STATES.MENU);
    setMode(null);
    setSurah('');
    setPage('');
    setJuz('');
    setSequenceResults(null);
    setError(null);
  };

  // Render based on state (exact specification)
  const renderContent = () => {
    switch (currentState) {
      case SEQ_STATES.MENU:
        return (
          <div className="seq-wizard-menu">
            <h2>🤖 What would you like?</h2>
            <div className="seq-options">
              <button onClick={() => setCurrentState(SEQ_STATES.SURAH_MODE)}>
                1. Sequence of Ayah in Surah
              </button>
              <button onClick={() => setCurrentState(SEQ_STATES.PAGE_MODE)}>
                2. Sequence of Ayah in Page
              </button>
              <button onClick={() => setCurrentState(SEQ_STATES.JUZ_PAGES_MODE)}>
                3. Sequence of Pages in Juz
              </button>
              <button onClick={() => setCurrentState(SEQ_STATES.JUZ_SURAH_INPUT)}>
                4. Sequence of Surahs in Juz
              </button>
            </div>
          </div>
        );

      case SEQ_STATES.SURAH_MODE:
        return (
          <div className="seq-wizard-step">
            <h3>🤖 Select Mode</h3>
            <div className="seq-options">
              <button onClick={() => { setMode('starting'); setCurrentState(SEQ_STATES.SURAH_INPUT); }}>
                1. Starting of Ayah (first 3 words)
              </button>
              <button onClick={() => { setMode('ending'); setCurrentState(SEQ_STATES.SURAH_INPUT); }}>
                2. Ending of Ayah (last 3 words)
              </button>
            </div>
            <button onClick={() => setCurrentState(SEQ_STATES.MENU)}>
              Back
            </button>
          </div>
        );

      case SEQ_STATES.SURAH_INPUT:
        return (
          <div className="seq-wizard-step">
            <h3>🤖 Enter Surah Number or Name</h3>
            <input
              type="text"
              value={surah}
              onChange={(e) => setSurah(e.target.value)}
              placeholder="e.g., 36 or Yaseen"
            />
            <button onClick={() => getSurahSequence(surah, mode)}>
              Get Sequence
            </button>
            <button onClick={() => setCurrentState(SEQ_STATES.SURAH_MODE)}>
              Back
            </button>
          </div>
        );

      case SEQ_STATES.SURAH_OUTPUT:
        return (
          <div className="seq-wizard-results">
            <h3>Surah {sequenceResults?.surahName}</h3>
            <div className="seq-output">
              {sequenceResults?.ayahs?.map((ayah, index) => (
                <div key={index} className="seq-item">
                  {index + 1}. {ayah.reference} - {ayah.text}
                </div>
              ))}
            </div>
            <button onClick={resetWizard}>
              Done
            </button>
          </div>
        );

      case SEQ_STATES.PAGE_MODE:
        return (
          <div className="seq-wizard-step">
            <h3>🤖 Select Mode</h3>
            <div className="seq-options">
              <button onClick={() => { setMode('starting'); setCurrentState(SEQ_STATES.PAGE_INPUT); }}>
                1. Starting of Ayah (first 3 words)
              </button>
              <button onClick={() => { setMode('ending'); setCurrentState(SEQ_STATES.PAGE_INPUT); }}>
                2. Ending of Ayah (last 3 words)
              </button>
            </div>
            <button onClick={() => setCurrentState(SEQ_STATES.MENU)}>
              Back
            </button>
          </div>
        );

      case SEQ_STATES.PAGE_INPUT:
        return (
          <div className="seq-wizard-step">
            <h3>🤖 Enter Page Number</h3>
            <input
              type="number"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              placeholder="e.g., 250"
            />
            <button onClick={() => getPageSequence(page, mode)}>
              Get Sequence
            </button>
            <button onClick={() => setCurrentState(SEQ_STATES.PAGE_MODE)}>
              Back
            </button>
          </div>
        );

      case SEQ_STATES.PAGE_OUTPUT:
        return (
          <div className="seq-wizard-results">
            <h3>Page {sequenceResults?.pageNumber}</h3>
            <div className="seq-output">
              {sequenceResults?.ayahs?.map((ayah, index) => (
                <div key={index} className="seq-item">
                  {index + 1}. {ayah.reference} - {ayah.text}
                </div>
              ))}
            </div>
            <button onClick={resetWizard}>
              Done
            </button>
          </div>
        );

      case SEQ_STATES.JUZ_PAGES_MODE:
        return (
          <div className="seq-wizard-step">
            <h3>🤖 Select Mode</h3>
            <div className="seq-options">
              <button onClick={() => { setMode('starting'); setCurrentState(SEQ_STATES.JUZ_PAGES_INPUT); }}>
                1. Starting of Page (first 3 words of first ayah)
              </button>
              <button onClick={() => { setMode('ending'); setCurrentState(SEQ_STATES.JUZ_PAGES_INPUT); }}>
                2. Ending of Page (last 3 words of last ayah)
              </button>
            </div>
            <button onClick={() => setCurrentState(SEQ_STATES.MENU)}>
              Back
            </button>
          </div>
        );

      case SEQ_STATES.JUZ_PAGES_INPUT:
        return (
          <div className="seq-wizard-step">
            <h3>🤖 Enter Juz Number</h3>
            <input
              type="number"
              value={juz}
              onChange={(e) => setJuz(e.target.value)}
              placeholder="e.g., 10"
            />
            <button onClick={() => getJuzPagesSequence(juz, mode)}>
              Get Sequence
            </button>
            <button onClick={() => setCurrentState(SEQ_STATES.JUZ_PAGES_MODE)}>
              Back
            </button>
          </div>
        );

      case SEQ_STATES.JUZ_PAGES_OUTPUT:
        return (
          <div className="seq-wizard-results">
            <h3>Juz {sequenceResults?.juzNumber}</h3>
            <div className="seq-output">
              {sequenceResults?.pages?.map((page, index) => (
                <div key={index} className="seq-item">
                  Page {page.pageNumber} - {page.surahName} - {page.text}
                </div>
              ))}
            </div>
            <button onClick={resetWizard}>
              Done
            </button>
          </div>
        );

      case SEQ_STATES.JUZ_SURAH_INPUT:
        return (
          <div className="seq-wizard-step">
            <h3>🤖 Enter Juz Number</h3>
            <input
              type="number"
              value={juz}
              onChange={(e) => setJuz(e.target.value)}
              placeholder="e.g., 30"
            />
            <button onClick={() => getJuzSurahSequence(juz)}>
              Get Sequence
            </button>
            <button onClick={() => setCurrentState(SEQ_STATES.MENU)}>
              Back
            </button>
          </div>
        );

      case SEQ_STATES.JUZ_SURAH_OUTPUT:
        return (
          <div className="seq-wizard-results">
            <h3>Juz {sequenceResults?.juzNumber}</h3>
            <div className="seq-output">
              {sequenceResults?.surahs?.map((surah, index) => (
                <div key={index} className="seq-item">
                  {index + 1}. {surah.name} ({surah.number})
                </div>
              ))}
            </div>
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
    <div className="sequence-wizard">
      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading-message">Loading...</div>}
      {renderContent()}
    </div>
  );
}
