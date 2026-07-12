// features/coach/hooks/useCoachStateMachine.js
//
// State machine hook for Ustadh AI coach workflow
// Manages all states and transitions based on the workflow document

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { COACH_STATES, ACCEPTED_PROFILES } from '../coachStates';
import { authFetch, API_BASE } from '../coachConstants';
import { useTour } from '../../../shared/context/TourContext';

// Helper function for ordinal suffixes (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function useCoachStateMachine() {
  const navigate = useNavigate();
  const { dispatchTourEvent } = useTour();
  const [currentState, setCurrentState] = useState(COACH_STATES.TIME_MANAGEMENT_START);
  const [stateData, setStateData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const goToHome = useCallback(() => {
    setCurrentState(COACH_STATES.TIME_MANAGEMENT_START);
    setStateData({});
  }, []);

  // SEQUENCE module handlers
  const handleSequenceOption = useCallback((option) => {
    switch (option) {
      case '1': // Sequence of Ayah in Surah
        setCurrentState(COACH_STATES.SEQUENCE_SURAH_MODE);
        break;
      case '2': // Sequence of Ayah in Page
        setCurrentState(COACH_STATES.SEQUENCE_PAGE_MODE);
        break;
      case '3': // Sequence of Pages in Juz
        setCurrentState(COACH_STATES.SEQUENCE_JUZ_PAGE_MODE);
        break;
      case '4': // Sequence of Surahs in Juz
        setCurrentState(COACH_STATES.SEQUENCE_JUZ_SURAH_INPUT);
        break;
      default:
        setCurrentState(COACH_STATES.SEQUENCE_HOME);
    }
  }, []);

  const handleSequenceMode = useCallback((mode) => {
    setStateData({ ...stateData, mode });
    if (currentState === COACH_STATES.SEQUENCE_SURAH_MODE) {
      setCurrentState(COACH_STATES.SEQUENCE_SURAH_INPUT);
    } else if (currentState === COACH_STATES.SEQUENCE_PAGE_MODE) {
      setCurrentState(COACH_STATES.SEQUENCE_PAGE_INPUT);
    } else if (currentState === COACH_STATES.SEQUENCE_JUZ_PAGE_MODE) {
      setCurrentState(COACH_STATES.SEQUENCE_JUZ_PAGE_INPUT);
    }
  }, [currentState, stateData]);

  const handleSequenceInput = useCallback(async (input) => {
    setLoading(true);
    setError(null);
    console.log('Starting sequence input, error cleared');
    try {
      let endpoint, body;
      
      if (currentState === COACH_STATES.SEQUENCE_SURAH_INPUT) {
        endpoint = '/coach/wizard/sequence/surah';
        body = { surah: input, mode: stateData.mode };
      } else if (currentState === COACH_STATES.SEQUENCE_PAGE_INPUT) {
        endpoint = '/coach/wizard/sequence/page';
        body = { page: input, mode: stateData.mode };
      } else if (currentState === COACH_STATES.SEQUENCE_JUZ_PAGE_INPUT) {
        endpoint = '/coach/wizard/sequence/juz-pages';
        body = { juz: input, mode: stateData.mode };
      } else if (currentState === COACH_STATES.SEQUENCE_JUZ_SURAH_INPUT) {
        endpoint = '/coach/wizard/sequence/juz-surahs';
        body = { juz: input };
      }

      console.log('Sending to backend:', endpoint, body);
      console.log('[Flashcard Generation] Request payload:', JSON.stringify(body, null, 2));
      const res = await authFetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const json = await res.json();
      console.log('Backend response:', json);

      if (json.success) {
        // Convert sequence data to flashcard format and save
        let cards = [];
        let setName = '';
        const mode = stateData.mode || 'starting';
        const modeLabel = mode === 'ending' ? 'Ending' : 'Starting';
        
        console.log('[Flashcard Generation] Set type detection:', {
          hasSurahName: !!json.data.surahName,
          hasPageNumber: !!json.data.pageNumber,
          hasJuzNumber: !!json.data.juzNumber,
          hasAyahs: !!json.data.ayahs,
          hasPages: !!json.data.pages,
          hasSurahs: !!json.data.surahs,
          mode: modeLabel
        });

        if (json.data.ayahs) {
          // Surah sequence or page sequence
          const isSurah = !!json.data.surahName;
          const isPage = !!json.data.pageNumber;
          setName = isSurah 
            ? `Sequence: ${json.data.surahName} (${modeLabel})` 
            : `Sequence: Page ${json.data.pageNumber} (${modeLabel})`;
          
          console.log('[Flashcard Generation] Set name:', setName);
          console.log('[Flashcard Generation] Set type:', isSurah ? 'Ayah in Surah' : 'Ayah in Page');

          // Generate specific study questions based on set type
          if (isSurah) {
            // Ayah in Surah questions
            cards = [
              { front: `What number surah is ${json.data.surahName} in the Quran?`, back: json.data.surahNumber?.toString() || 'Unknown' },
              { front: `In which sipara/juz does ${json.data.surahName} appear?`, back: json.data.juzInfo || 'See Quran data' },
              { front: `On which page does ${json.data.surahName} start, and how many pages does it span?`, back: json.data.pageInfo || 'See Quran data' },
              { front: `What are the names of the surahs immediately before and after ${json.data.surahName}?`, back: json.data.neighboringSurahs || 'See Quran data' },
              { front: `How many total ayaat does ${json.data.surahName} have?`, back: json.data.ayahCount?.toString() || 'See Quran data' },
              ...json.data.ayahs.map((ayah, index) => ({
                front: `What is the ${index + 1}${getOrdinalSuffix(index + 1)} ayah of ${json.data.surahName}?`,
                back: ayah.text,
              }))
            ];
          } else {
            // Ayah in Page questions
            cards = [
              { front: `What is the first ayah on Page ${json.data.pageNumber}?`, back: json.data.firstAyah || 'See Quran data' },
              { front: `What is the last ayah on Page ${json.data.pageNumber}?`, back: json.data.lastAyah || 'See Quran data' },
              { front: `What is the last ayah of the page before Page ${json.data.pageNumber}, and the first ayah of the page after?`, back: json.data.neighboringAyahs || 'See Quran data' },
              { front: `In which juz and surah does Page ${json.data.pageNumber} fall?`, back: json.data.juzSurahInfo || 'See Quran data' },
              { front: `How many total ayaat are on Page ${json.data.pageNumber}?`, back: json.data.ayahCount?.toString() || 'See Quran data' },
              ...json.data.ayahs.map((ayah, index) => ({
                front: `What is the ${index + 1}${getOrdinalSuffix(index + 1)} ayah on Page ${json.data.pageNumber}?`,
                back: ayah.text,
              }))
            ];
          }
        } else if (json.data.pages) {
          // Juz pages sequence
          const juzNum = json.data.juzNumber;
          setName = `Sequence: Juz ${juzNum} (${modeLabel})`;
          
          console.log('[Flashcard Generation] Set name:', setName);
          console.log('[Flashcard Generation] Set type: Page in Juz');

          // Generate specific study questions for Juz pages
          cards = [
            { front: `What is the first ayah of Juz ${juzNum}?`, back: json.data.firstAyah || 'See Quran data' },
            { front: `What is the last ayah of Juz ${juzNum}?`, back: json.data.lastAyah || 'See Quran data' },
            { front: `How many surahs does Juz ${juzNum} consist of — list each by number and name?`, back: json.data.surahList || 'See Quran data' },
            ...json.data.pages.map((page) => ({
              front: `What is the ${modeLabel === 'Starting' ? 'first' : 'last'} ayah on Page ${page.pageNumber} of Juz ${juzNum}?`,
              back: page.text,
            }))
          ];
        } else if (json.data.surahs) {
          // Juz surahs sequence
          const juzNum = json.data.juzNumber;
          setName = `Sequence: Juz ${juzNum} (${modeLabel})`;
          
          console.log('[Flashcard Generation] Set name:', setName);
          console.log('[Flashcard Generation] Set type: Surah in Juz');

          // Generate specific study questions for Juz surahs
          cards = [
            { front: `How many surahs does Juz ${juzNum} consist of — list each with surah number, surah name, and its first ayah?`, back: json.data.surahDetails || 'See Quran data' },
            { front: `What is the assigned number of each surah in Juz ${juzNum} in the Quran?`, back: json.data.surahNumbers || 'See Quran data' },
            { front: `How many ayaat does each surah in Juz ${juzNum} have?`, back: json.data.surahAyahCounts || 'See Quran data' },
            ...json.data.surahs.map((surah) => ({
              front: `What is Surah ${surah.number} in Juz ${juzNum}?`,
              back: surah.name,
            }))
          ];
        }

        // Save flashcards to backend
        if (cards.length > 0) {
          const flashcardRes = await authFetch(`${API_BASE}/flashcards/user-sets`, {
            method: 'POST',
            body: JSON.stringify({ name: setName, cards }),
          });
          const flashcardJson = await flashcardRes.json();
          console.log('Flashcard creation response:', flashcardJson);
          
          if (flashcardJson.success) {
            console.log('Flashcard creation successful, navigating to flashcards page');
            setError(null); // Clear any previous error
            setStateData({ ...stateData, result: json.data, flashcardSetId: flashcardJson.data.id });
            // Navigate to flashcards page
            navigate('/flashcards');
            goToHome();
          } else {
            console.error('Flashcard creation failed:', flashcardJson.message);
            setError(flashcardJson.message || 'Failed to create flashcards');
          }
        } else {
          console.error('No cards to create');
          setError('No sequence data found to create flashcards');
        }
      } else {
        setError(json.message || 'Failed to fetch sequence');
      }
    } catch (e) {
      console.error('Sequence fetch error:', e);
      setError('Failed to fetch sequence. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentState, stateData, navigate, goToHome]);

  // MUTASHABIHAT module handlers
  const handleMutashabihatSearch = useCallback(async (surah, ayah) => {
    setLoading(true);
    setError(null);
    try {
      // Navigate to similarity page with state for auto-search
      navigate('/similarity', { 
        state: { 
          autoSearch: true, 
          surah: surah, 
          ayah: ayah 
        } 
      });
      goToHome();
    } catch (e) {
      console.error('Mutashabihat search error:', e);
      setError('Failed to search mutashabihat. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate, goToHome]);

  const handleMutashabihatPairTip = useCallback(async (pair) => {
    setLoading(true);
    setError(null);
    try {
      // Generate a simple tip without AI for now
      const tip = `Focus on the unique words in Surah ${pair.b.surah}:${pair.b.ayah} that differ from Surah ${pair.a.surah}:${pair.a.ayah}. Look for contextual clues in the surrounding verses.`;
      
      console.log('Generated tip:', tip);
      console.log('Pair:', pair);
      
      // Save tip to database
      const tipRes = await authFetch(
        `${API_BASE}/similarity/by-pair/tips?ss=${pair.a.surah}&sa=${pair.a.ayah}&ts=${pair.b.surah}&ta=${pair.b.ayah}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ tips: [tip] }),
        }
      );
      const tipJson = await tipRes.json();
      console.log('Tip save response:', tipJson);
      
      if (!tipJson.success) {
        console.error('Failed to save tip to database:', tipJson.message);
        // Still navigate with the tip in state even if DB save fails
      }
      
      // Navigate to similarity page with the tip
      // The SidePanel looks for tips keyed by targetSurah:targetAyah
      navigate('/similarity', { 
        state: { 
          autoSearch: true, 
          surah: pair.a.surah, 
          ayah: pair.a.ayah,
          targetSurah: pair.b.surah,
          targetAyah: pair.b.ayah,
          coachTips: {
            [`${pair.b.surah}:${pair.b.ayah}`]: tip
          },
          // Also include source key for completeness
          sourceSurah: pair.a.surah,
          sourceAyah: pair.a.ayah
        } 
      });
      goToHome();
    } catch (e) {
      console.error('Tip generation error:', e);
      setError('Failed to generate tip. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate, goToHome]);

  const handleMutashabihatAllTips = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      // Navigate to similarity page with state for auto-search
      navigate('/similarity', { 
        state: { 
          autoSearch: true, 
          surah: data.surah, 
          ayah: data.ayah 
        } 
      });
      goToHome();
    } catch (e) {
      console.error('All tips generation error:', e);
      setError('Failed to generate tips. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate, goToHome]);

  const handleMutashabihatOption = useCallback((option) => {
    switch (option) {
      case '1': // Find Mutashabihat
        setCurrentState(COACH_STATES.MUTASHABIHAT_SEARCH_SURAH);
        break;
      case '2': // Help me remember a Pair
        setCurrentState(COACH_STATES.MUTASHABIHAT_PAIR_A_SURAH);
        break;
      case '3': // Help me remember all pairs of an Ayah
        setCurrentState(COACH_STATES.MUTASHABIHAT_ALL_PAIRS_SURAH);
        break;
      default:
        setCurrentState(COACH_STATES.MUTASHABIHAT_HOME);
    }
  }, []);

  // BEST METHOD (Sensory Profile) handlers
  const handleAssessmentCheck = useCallback(async (hasCompleted) => {
    if (hasCompleted) {
      // Fetch existing profile before showing input
      setLoading(true);
      setError(null);
      try {
        const profileJson = await authFetch('/auth/me');
        
        const existingProfile = profileJson.success ? profileJson.data?.sensoryProfile : null;
        setStateData({ ...stateData, existingProfile });
        setCurrentState(COACH_STATES.STYLE_PROFILE_INPUT);
      } catch (e) {
        console.error('Failed to fetch existing profile:', e);
        setStateData({ ...stateData, existingProfile: null });
        setCurrentState(COACH_STATES.STYLE_PROFILE_INPUT);
      } finally {
        setLoading(false);
      }
    } else {
      // Navigate to best-method page
      navigate('/best-method');
      goToHome();
    }
  }, [navigate, goToHome, stateData]);

  const handleProfileInput = useCallback(async (profile, isUpdate = false) => {
    setLoading(true);
    setError(null);
    try {
      // Normalize profile
      const normalized = profile.trim();
      
      // Validate against accepted profiles
      const isValid = ACCEPTED_PROFILES.some(
        p => p.toLowerCase() === normalized.toLowerCase()
      );

      if (!isValid) {
        setError('Invalid profile. Please use one of the accepted profiles.');
        setLoading(false);
        return;
      }

      // Save profile
      const json = await authFetch('/auth/sensory-profile', {
        method: 'PATCH',
        body: JSON.stringify({ sensoryProfile: normalized }),
      });

      if (json.success) {
        setStateData({ ...stateData, profile: normalized, saved: true, existingProfile: normalized });
        // Show success then go home
        setTimeout(() => goToHome(), 2000);
      } else {
        setError(json.message || 'Failed to save profile');
      }
    } catch (e) {
      console.error('Profile save error:', e);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [stateData, goToHome]);

  return {
    currentState,
    stateData,
    loading,
    error,
    setError,
    
    // HOME
    goToHome,
    
    // SEQUENCE
    handleSequenceOption,
    handleSequenceMode,
    handleSequenceInput,
    
    // MUTASHABIHAT
    handleMutashabihatOption,
    handleMutashabihatSearch,
    handleMutashabihatPairTip,
    handleMutashabihatAllTips,
    
    // BEST METHOD
    handleAssessmentCheck,
    handleProfileInput,
  };
}
