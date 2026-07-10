//C:\quran-similarity-app\frontend\src\features\flashcards\components\TestView.jsx
import React, { useState } from 'react';

export default function TestView({ cards }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => { setIsFlipped(false); setCurrentIndex((prev) => (prev + 1) % cards.length); };
  const handlePrev = () => { setIsFlipped(false); setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length); };

  return (
    <div className="test-view-container">
      <div className="card-counter">Card {currentIndex + 1} of {cards.length}</div>
      
      <div className="flashcard" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
          <div className="flashcard-front">
            <h3>{cards[currentIndex].front}</h3>
            <p className="click-hint">(Click to reveal answer)</p>
          </div>
          <div className="flashcard-back">
            <p style={{ whiteSpace: 'pre-line' }}>{cards[currentIndex].back}</p>
          </div>
        </div>
      </div>

      <div className="flashcard-nav">
        <button onClick={handlePrev}>← Previous</button>
        <button onClick={handleNext}>Next →</button>
      </div>
    </div>
  );
}