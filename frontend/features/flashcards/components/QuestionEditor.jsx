// features/flashcards/components/QuestionEditor.jsx
// ─── Modal to edit, delete, and create custom questions for user sets ────────
import React, { useState, useCallback } from 'react';
import { authFetch } from '../../../shared/services/http';

// Detect set type and number from name
function detectSetInfo(setName) {
  const pageMatch = setName.match(/\b(?:page|pg\.?)\s*(\d{1,3})\b/i);
  if (pageMatch) return { type: 'page', num: parseInt(pageMatch[1]) };

  const juzMatch = setName.match(/\b(?:juz|juzz|para|sipara)\s*(\d{1,2})\b/i);
  if (juzMatch) return { type: 'juz', num: parseInt(juzMatch[1]) };

  const bracketMatch = setName.match(/\((\d{1,3})\)/);
  if (bracketMatch) return { type: 'surah', num: parseInt(bracketMatch[1]) };
  
  const surahWordMatch = setName.match(/\bsurah\s+(\d{1,3})\b/i);
  if (surahWordMatch) return { type: 'surah', num: parseInt(surahWordMatch[1]) };

  const plainNum = setName.match(/\b(\d{1,3})\b/);
  if (plainNum) return { type: 'surah', num: parseInt(plainNum[1]) };

  return null;
}

// Generate fixed questions based on topic type
function generateFixedQuestions(setInfo) {
  if (!setInfo) return [];

  const { type, num } = setInfo;
  const questions = [];

  if (type === 'juz') {
    questions.push(
      {
        id: 'juz-first-page-ayahs',
        text: `What are the first and last ayahs on the first page of Juz ${num}?`,
        answer: '',
        isFixed: true,
      },
      {
        id: 'juz-last-page-ayahs',
        text: `What are the first and last ayahs on the last page of Juz ${num}?`,
        answer: '',
        isFixed: true,
      },
      {
        id: 'juz-surahs-count',
        text: `How many surahs are present in Juz ${num}? List their names and sequence.`,
        answer: '',
        isFixed: true,
      }
    );
  } else if (type === 'surah') {
    questions.push(
      {
        id: 'surah-prev',
        text: `What is the name of the surah that comes before Surah ${num}, and what is its first ayah?`,
        answer: '',
        isFixed: true,
      },
      {
        id: 'surah-next',
        text: `What is the name of the surah that comes after Surah ${num}, and what is its first ayah?`,
        answer: '',
        isFixed: true,
      },
      {
        id: 'surah-same-opening',
        text: `How many surahs have the same opening words (starting ayah pattern) as Surah ${num}?`,
        answer: '',
        isFixed: true,
      },
      {
        id: 'surah-ayah-count',
        text: `How many ayahs are there in Surah ${num}?`,
        answer: '',
        isFixed: true,
      },
      {
        id: 'surah-pages',
        text: `Across which pages of the Juz does Surah ${num} extend? (Starting and ending page)`,
        answer: '',
        isFixed: true,
      }
    );
  } else if (type === 'page') {
    questions.push(
      {
        id: 'page-first-ayah',
        text: `What is the first ayah on Page ${num}?`,
        answer: '',
        isFixed: true,
      },
      {
        id: 'page-last-ayah',
        text: `What is the last ayah on Page ${num}?`,
        answer: '',
        isFixed: true,
      },
      {
        id: 'page-surah',
        text: `Which surah(s) are present on Page ${num}?`,
        answer: '',
        isFixed: true,
      },
      {
        id: 'page-ayah-count',
        text: `How many ayahs are on Page ${num}?`,
        answer: '',
        isFixed: true,
      }
    );
  }

  return questions;
}

export default function QuestionEditor({ setId, setName, onClose, isOpen, onSaved }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load questions when modal opens
  React.useEffect(() => {
    if (!isOpen) return;
    const loadQuestions = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await authFetch(`/flashcards/user-sets/${setId}/questions`, {}, 'loadQuestions');
        if (res?.success && res.data && res.data.length > 0) {
          setQuestions(res.data);
        } else {
          // Generate fixed questions if none saved
          const setInfo = detectSetInfo(setName);
          const fixed = generateFixedQuestions(setInfo);
          setQuestions(fixed);
        }
      } catch (e) {
        console.error('[QuestionEditor] Failed to load questions for set:', setId, e);
        const setInfo = detectSetInfo(setName);
        const fixed = generateFixedQuestions(setInfo);
        setQuestions(fixed);
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, [isOpen, setId, setName]);

  const saveQuestions = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      const res = await authFetch(
        `/flashcards/user-sets/${setId}/questions`,
        { method: 'POST', body: JSON.stringify({ questions }) },
        'saveQuestions'
      );
      if (res?.success) {
        setEditingId(null);
        onSaved?.(res.data || questions);
      } else {
        setError(res.message || res.error || 'Failed to save questions');
      }
    } catch (e) {
      console.error('[QuestionEditor] Failed to save questions for set:', setId, e);
      setError('Error saving questions: ' + e.message);
    } finally {
      setSaving(false);
    }
  }, [setId, questions]);

  const deleteQuestion = (id) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const addCustomQuestion = async () => {
    if (!newQuestion.trim()) {
      setError('Question cannot be empty');
      return;
    }
    if (!newAnswer.trim()) {
      setError('Answer cannot be empty');
      return;
    }
    
    const newQ = {
      id: `custom-${Date.now()}`,
      text: newQuestion,
      answer: newAnswer,
      isFixed: false,
    };
    
    setQuestions(prev => [...prev, newQ]);
    setNewQuestion('');
    setNewAnswer('');
    setError('');
  };

  const updateQuestion = (id, newText, newAnswerText) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, text: newText, answer: newAnswerText } : q
    ));
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white', borderRadius: 12, maxWidth: 700, width: '90%',
        maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#004D40', color: '#fff', borderRadius: '12px 12px 0 0',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>✏️ Study Questions & Answers</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
            fontSize: 24, lineHeight: 1, padding: 0,
          }}>×</button>
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
              padding: '10px 14px', color: '#991B1B', marginBottom: 16, fontSize: 13,
            }}>
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 20 }}>Loading questions…</div>
          ) : (
            <>
              {/* Questions List */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                  Study Questions
                </h4>
                {questions.length === 0 ? (
                  <div style={{ color: '#9CA3AF', textAlign: 'center', padding: 20 }}>
                    No questions yet. Add one below!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {questions.map((q) => (
                      <div
                        key={q.id}
                        style={{
                          background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8,
                          padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
                        }}
                      >
                        {editingId === q.id ? (
                          <>
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>Question</label>
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                style={{
                                  width: '100%', marginTop: 4, padding: 8, border: '2px solid #004D40', borderRadius: 6,
                                  fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
                                  minHeight: 50,
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>Answer</label>
                              <textarea
                                value={editAnswer}
                                onChange={(e) => setEditAnswer(e.target.value)}
                                style={{
                                  width: '100%', marginTop: 4, padding: 8, border: '2px solid #004D40', borderRadius: 6,
                                  fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
                                  minHeight: 50,
                                }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button
                                onClick={() => {
                                  updateQuestion(q.id, editText, editAnswer);
                                  setEditingId(null);
                                }}
                                style={{
                                  background: '#004D40', color: '#fff', border: 'none',
                                  borderRadius: 4, padding: '6px 12px', fontSize: 11,
                                  cursor: 'pointer', fontWeight: 600, flex: 1,
                                }}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                style={{
                                  background: '#F3F4F6', color: '#6B7280', border: 'none',
                                  borderRadius: 4, padding: '6px 12px', fontSize: 11,
                                  cursor: 'pointer', flex: 1,
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 4 }}>
                                Q: {q.isFixed && <span style={{ color: '#004D40', marginLeft: 8, background: '#E6F4F1', padding: '1px 6px', borderRadius: 3, fontSize: 9 }}>Fixed</span>}
                              </div>
                              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                                {q.text}
                              </div>
                            </div>
                            {q.answer && (
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 4 }}>A:</div>
                                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, padding: '8px', background: '#F0FDF4', borderRadius: 6 }}>
                                  {q.answer}
                                </div>
                              </div>
                            )}
                            {!q.answer && (
                              <div style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                                No answer yet
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              {!q.isFixed && (
                                <>
                                  <button
                                    onClick={() => { setEditingId(q.id); setEditText(q.text); setEditAnswer(q.answer || ''); }}
                                    style={{
                                      background: 'none', border: '1px solid #D1D5DB',
                                      borderRadius: 4, padding: '4px 8px', cursor: 'pointer',
                                      color: '#6B7280', fontSize: 11, fontWeight: 600,
                                    }}
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => deleteQuestion(q.id)}
                                    style={{
                                      background: '#FEF2F2', border: '1px solid #FECACA',
                                      borderRadius: 4, padding: '4px 8px', cursor: 'pointer',
                                      color: '#DC2626', fontSize: 11, fontWeight: 600,
                                    }}
                                  >
                                    🗑 Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Custom Question */}
              <div style={{
                background: '#F0FDF4', border: '2px solid #BBF7D0', borderRadius: 8,
                padding: 12, marginBottom: 20,
              }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#065F46', display: 'block', marginBottom: 12 }}>
                  ➕ Add Custom Question & Answer
                </label>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#065F46', display: 'block', marginBottom: 4 }}>Question</label>
                  <textarea
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Type your study question…"
                    style={{
                      width: '100%', padding: 8, border: '1px solid #BBF7D0', borderRadius: 6,
                      fontSize: 13, fontFamily: 'inherit', resize: 'vertical', minHeight: 50,
                      marginBottom: 8,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#065F46', display: 'block', marginBottom: 4 }}>Answer</label>
                  <textarea
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="Type the answer…"
                    style={{
                      width: '100%', padding: 8, border: '1px solid #BBF7D0', borderRadius: 6,
                      fontSize: 13, fontFamily: 'inherit', resize: 'vertical', minHeight: 50,
                      marginBottom: 8,
                    }}
                  />
                </div>
                <button
                  onClick={addCustomQuestion}
                  disabled={!newQuestion.trim() || !newAnswer.trim() || saving}
                  style={{
                    background: '#004D40', color: '#fff', border: 'none',
                    borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13,
                    fontWeight: 600, width: '100%',
                    opacity: (!newQuestion.trim() || !newAnswer.trim() || saving) ? 0.6 : 1,
                  }}
                >
                  {saving ? 'Saving…' : '+ Add Question'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid #E5E7EB', background: '#F9FAFB',
          display: 'flex', gap: 8, justifyContent: 'flex-end', borderRadius: '0 0 12px 12px',
          position: 'sticky', bottom: 0, zIndex: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              background: '#F3F4F6', color: '#374151', border: 'none',
              borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Close
          </button>
          <button
            onClick={() => { saveQuestions(); }}
            disabled={saving}
            style={{
              background: '#004D40', color: '#fff', border: 'none',
              borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving…' : '💾 Save All'}
          </button>
        </div>
      </div>
    </div>
  );
}
