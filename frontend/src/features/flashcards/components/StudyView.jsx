// C:\quran-similarity-app\frontend\src\features\flashcards\components\StudyView.jsx
import React, { useState, useEffect } from 'react';
import { API_BASE, getAuthHeader } from '../../../shared/services/apiConfig';

export default function StudyView({ category }) {
  const [displayCards, setDisplayCards] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => {
    // If category has direct cards (user flashcards or built-in), use them directly
    if (category.cards && category.cards.length > 0) {
      setDisplayCards(
        category.cards.map((card, i) => ({
          id:    i,
          front: card.front,
          back:  card.back,
        }))
      );
      setError('');
      return;
    }

    // If it's a built-in category with study HTML, try to parse ayah references
    if (category.study) {
      setLoading(true);
      setError('');

      const parseAndFetchAyahs = async (htmlContent) => {
        try {
          // Extract unique ayah references like "2:255" from HTML
          const ayahRegex  = /(\d+):(\d+)/g;
          const matches    = [...htmlContent.matchAll(ayahRegex)];

          if (matches.length === 0) {
            setDisplayCards([]);
            setLoading(false);
            return;
          }

          const uniqueAyahs = [...new Set(matches.map(m => `${m[1]}:${m[2]}`))];

          // Fix: fetch all ayahs in parallel instead of serially
          const results = await Promise.all(
            uniqueAyahs.map(async (ayahRef) => {
              const [surah, ayah] = ayahRef.split(':');
              try {
                const res  = await fetch(
                  `${API_BASE}/ayah/${surah}/${ayah}`,
                  { headers: getAuthHeader() }
                );
                const json = await res.json();
                if (json.success && json.data) {
                  return { id: ayahRef, front: ayahRef, back: json.data.text };
                }
              } catch (e) {
                console.error(`Failed to fetch ayah ${ayahRef}:`, e);
              }
              return null;
            })
          );

          setDisplayCards(results.filter(Boolean));
        } catch (e) {
          console.error('[StudyView] Error loading ayahs for category:', category?.id, e);
          setError('Failed to load ayah data.');
          setDisplayCards([]);
        } finally {
          setLoading(false);
        }
      };

      parseAndFetchAyahs(category.study);
    }
  }, [category]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
        Loading ayahs…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '12px 16px', background: '#FEF2F2',
        border: '1px solid #FECACA', borderRadius: 8,
        fontSize: 13, color: '#991B1B',
      }}>
        {error}
      </div>
    );
  }

  // No parsed ayahs found — fall back to rendering raw HTML study material
  if (displayCards.length === 0) {
    return (
      <div
        className="study-view-container"
        dangerouslySetInnerHTML={{ __html: category.study }}
      />
    );
  }

  return (
    <div className="study-view-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {displayCards.map((card, i) => (
          <div
            key={card.id}
            style={{
              background:   'white',
              border:       '1px solid #E5E7EB',
              borderRadius: 12,
              overflow:     'hidden',
              boxShadow:    '0 1px 4px rgba(0,0,0,0.06)',
              padding:      '16px',
            }}
          >
            <div style={{
              background:    '#F0FDF4',
              borderBottom:  '1px solid #D1FAE5',
              marginBottom:  12,
              padding:       '8px 12px',
              borderRadius:  6,
              fontSize:      13,
              fontWeight:    700,
              color:         '#065F46',
            }}>
              Ayah {card.front}
            </div>
            <div style={{
              fontSize:    16,
              fontWeight:  600,
              color:       '#111827',
              lineHeight:  1.8,
              textAlign:   'right',
              direction:   'rtl',
              fontFamily:  "'Traditional Arabic', 'Amiri', serif",
            }}>
              {card.back}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}