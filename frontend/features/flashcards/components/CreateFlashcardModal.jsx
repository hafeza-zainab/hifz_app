// frontend/src/features/flashcards/components/CreateFlashcardModal.jsx
import React, { useState } from 'react';
import { authFetch } from '../../../shared/services/http';

// Helper function for ordinal suffixes (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default function CreateFlashcardModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('type'); // 'type', 'input', 'generating'
  const [selectedSetType, setSelectedSetType] = useState('');
  const [mode, setMode] = useState('starting');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setTypes = [
    { id: 'surah', label: 'Sequence of Ayah in Surah', icon: '📖' },
    { id: 'page', label: 'Sequence of Ayah in Page', icon: '📄' },
    { id: 'juz-pages', label: 'Sequence of Pages in Juz', icon: '📚' },
    { id: 'juz-surahs', label: 'Sequence of Surahs in Juz', icon: '🗂️' },
  ];

  const handleTypeSelect = (typeId) => {
    setSelectedSetType(typeId);
    setStep('input');
  };

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError('Please enter a value');
      return;
    }

    setLoading(true);
    setError('');
    setStep('generating');

    try {
      let endpoint, body;
      
      if (selectedSetType === 'surah') {
        endpoint = '/coach/wizard/sequence/surah';
        body = { surah: parseInt(input), mode };
      } else if (selectedSetType === 'page') {
        endpoint = '/coach/wizard/sequence/page';
        body = { page: parseInt(input), mode };
      } else if (selectedSetType === 'juz-pages') {
        endpoint = '/coach/wizard/sequence/juz-pages';
        body = { juz: parseInt(input), mode };
      } else if (selectedSetType === 'juz-surahs') {
        endpoint = '/coach/wizard/sequence/juz-surahs';
        body = { juz: parseInt(input) };
      }

      const res = await authFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const json = res; // authFetch already returns parsed JSON

        if (json.success) {
        // Convert sequence data to flashcard format and save
        let cards = [];
        let setName = '';
        const modeLabel = mode === 'ending' ? 'Ending' : 'Starting';

        console.log('[QUESTIONS SOURCE] CreateFlashcardModal - Starting question generation for:', selectedSetType);

        if (json.data.ayahs) {
          const isSurah = !!json.data.surahName;
          const isPage = !!json.data.pageNumber;

          if (isSurah) {
            // SURAH sets - exactly 5 questions
            setName = `Sequence: ${json.data.surahName} (${modeLabel})`;
            cards = [
              { front: `What number surah is ${json.data.surahName} in the Quran?`, back: json.data.surahNumber?.toString() || 'Unknown' },
              { front: `In which sipara/juz does ${json.data.surahName} appear?`, back: json.data.juzInfo || 'See Quran data' },
              { front: `On which page does ${json.data.surahName} start, and how many pages does it span?`, back: json.data.pageInfo || 'See Quran data' },
              { front: `What are the names of the surahs immediately before and after ${json.data.surahName}?`, back: typeof json.data.neighboringSurahs === 'object' ? `Previous: ${json.data.neighboringSurahs.previous || 'N/A'}, Current: ${json.data.neighboringSurahs.current || 'Unknown'}, Next: ${json.data.neighboringSurahs.next || 'N/A'}` : json.data.neighboringSurahs || 'See Quran data' },
              { front: `How many total ayaat does ${json.data.surahName} have?`, back: json.data.ayahCount?.toString() || 'See Quran data' },
            ];
            console.log('[QUESTIONS SOURCE] SURAH set generated:', cards.length, 'questions');
          } else if (isPage) {
            // PAGE sets - exactly 5 questions
            setName = `Sequence: Page ${json.data.pageNumber} (${modeLabel})`;
            
            cards = [
              { front: `What is the first ayah on Page ${json.data.pageNumber}?`, back: `${json.data.firstAyahText || json.data.ayahs[0]?.fullText || json.data.ayahs[0]?.text || ''}\n\n(${json.data.firstAyah || 'Unknown'})` },
              { front: `What is the last ayah on Page ${json.data.pageNumber}?`, back: `${json.data.lastAyahText || json.data.ayahs[json.data.ayahs.length - 1]?.fullText || json.data.ayahs[json.data.ayahs.length - 1]?.text || ''}\n\n(${json.data.lastAyah || 'Unknown'})` },
              { front: `What is the last ayah of the page before Page ${json.data.pageNumber}, and the first ayah of the page after?`, back: typeof json.data.neighboringAyahs === 'object' ? `Last of previous page: ${json.data.neighboringAyahs.previousPageLast || 'N/A'}\n${json.data.neighboringAyahs.previousPageLastText || ''}\n\nFirst of current page: ${json.data.neighboringAyahs.currentPageFirst || 'Unknown'}\n${json.data.neighboringAyahs.currentPageFirstText || ''}\n\nLast of current page: ${json.data.neighboringAyahs.currentPageLast || 'Unknown'}\n${json.data.neighboringAyahs.currentPageLastText || ''}\n\nFirst of next page: ${json.data.neighboringAyahs.nextPageFirst || 'N/A'}\n${json.data.neighboringAyahs.nextPageFirstText || ''}` : json.data.neighboringAyahs || 'See Quran data' },
              { front: `In which juz and surah does Page ${json.data.pageNumber} fall?`, back: json.data.juzSurahInfo || 'See Quran data' },
              { front: `How many total ayaat are on Page ${json.data.pageNumber}?`, back: json.data.ayahCount?.toString() || 'See Quran data' },
            ];
            console.log('[QUESTIONS SOURCE] PAGE set generated:', cards.length, 'questions');
            
            // Validation check
            if (cards.length > 5) {
              console.error('[ERROR] Too many questions for page set:', cards.length, 'Sources:', cards.map(c => c.front));
            }
          }
        } else if (json.data.pages) {
          // JUZ PAGE SEQUENCE sets - exactly 3 questions
          const juzNum = json.data.juzNumber;
          setName = `Sequence: Juz ${juzNum} Pages (${modeLabel})`;
          
          // Use the actual first and last ayahs of the juz from backend
          const firstPageFirstAyah = json.data.firstPageFirstAyah || json.data.pages[0]?.text || '';
          const lastPageLastAyah = json.data.lastPageLastAyah || json.data.pages[json.data.pages.length - 1]?.text || '';
          
          cards = [
            { front: `What is the first ayah of Juz ${juzNum}?`, back: `${firstPageFirstAyah}\n\n(Page ${json.data.firstPage || 'Unknown'})` },
            { front: `What is the last ayah of Juz ${juzNum}?`, back: `${lastPageLastAyah}\n\n(Page ${json.data.lastPage || 'Unknown'})` },
            { front: `How many surahs does Juz ${juzNum} consist of?`, back: json.data.surahList || 'See Quran data' },
          ];
          console.log('[QUESTIONS SOURCE] JUZ PAGE set generated:', cards.length, 'questions');
        } else if (json.data.surahs) {
          // JUZ SURAH SEQUENCE sets - exactly 3 questions
          const juzNum = json.data.juzNumber;
          setName = `Sequence: Juz ${juzNum} (${modeLabel})`;
          cards = [
            { front: `How many surahs does Juz ${juzNum} consist of?`, back: json.data.surahDetails || 'See Quran data' },
            { front: `What is the assigned Quran number of each surah in this juz?`, back: json.data.surahNumbers || 'See Quran data' },
            { front: `How many ayaat does each surah in Juz ${juzNum} have?`, back: json.data.surahAyahCounts || 'See Quran data' },
          ];
          console.log('[QUESTIONS SOURCE] JUZ SURAH set generated:', cards.length, 'questions');
        }

        console.log('[QUESTIONS SOURCE] Final questions array:', cards.length, cards.map(c => c.front));

        // Save flashcard set to database
        const saveRes = await authFetch('/flashcards/user-sets', {
          method: 'POST',
          body: JSON.stringify({ name: setName, cards }),
        }, 'saveFlashcardSet');

        if (saveRes?.success) {
          onSuccess();
          onClose();
        } else {
          setError('Failed to save flashcard set');
          setStep('input');
        }
      } else {
        setError('Failed to generate flashcards');
        setStep('input');
      }
    } catch (err) {
      console.error('[CreateFlashcardModal] Error:', err);
      setError('An error occurred while generating flashcards');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const getInputPlaceholder = () => {
    switch (selectedSetType) {
      case 'surah': return 'Enter Surah number (e.g., 1)';
      case 'page': return 'Enter Page number (e.g., 1)';
      case 'juz-pages':
      case 'juz-surahs': return 'Enter Juz number (e.g., 1)';
      default: return 'Enter value';
    }
  };

  const getInputLabel = () => {
    switch (selectedSetType) {
      case 'surah': return 'Surah Number';
      case 'page': return 'Page Number';
      case 'juz-pages':
      case 'juz-surahs': return 'Juz Number';
      default: return 'Value';
    }
  };

  return (
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
      zIndex: 1000,
    }} data-tour="flashcard-type-modal">
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '90%',
        maxWidth: 500,
        maxHeight: '90vh',
        overflow: 'auto',
        padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#111827' }}>
            {step === 'type' ? 'Select Set Type' : step === 'input' ? 'Configure Set' : 'Generating...'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}
          >
            ×
          </button>
        </div>

        {step === 'type' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {setTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                style={{
                  padding: 16,
                  background: '#F9FAFB',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all .15s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#F0FDF4';
                  e.currentTarget.style.borderColor = '#004D40';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                <span style={{ fontSize: 24 }}>{type.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{type.label}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'input' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button
              onClick={() => setStep('type')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              ← Back
            </button>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                {getInputLabel()}
              </label>
              <input
                type="number"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={getInputPlaceholder()}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                }}
                autoFocus
              />
            </div>

            {(selectedSetType === 'surah' || selectedSetType === 'page' || selectedSetType === 'juz-pages') && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Mode
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setMode('starting')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: mode === 'starting' ? '#004D40' : '#F9FAFB',
                      border: mode === 'starting' ? 'none' : '1.5px solid #E5E7EB',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      color: mode === 'starting' ? '#fff' : '#111827',
                    }}
                  >
                    Starting
                  </button>
                  <button
                    onClick={() => setMode('ending')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: mode === 'ending' ? '#004D40' : '#F9FAFB',
                      border: mode === 'ending' ? 'none' : '1.5px solid #E5E7EB',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      color: mode === 'ending' ? '#fff' : '#111827',
                    }}
                  >
                    Ending
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div style={{ fontSize: 12, color: '#DC2626', background: '#FEF2F2', padding: '8px 12px', borderRadius: 6 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                padding: '12px',
                background: '#004D40',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {loading ? 'Generating...' : 'Generate Flashcard Set'}
            </button>
          </div>
        )}

        {step === 'generating' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <p style={{ fontSize: 14, color: '#6B7280' }}>Generating your flashcard set...</p>
          </div>
        )}
      </div>
    </div>
  );
}
