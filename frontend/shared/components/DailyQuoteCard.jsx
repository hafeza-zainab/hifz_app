import React, { useState, useEffect } from 'react';
import { dailyQuotes } from '../data/dailyQuotes';

const DailyQuoteCard = ({ username, onDismiss }) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const [showContinue, setShowContinue] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [skipTimeLeft, setSkipTimeLeft] = useState(10);

  // Get today's quote based on day of year
  const getDailyQuote = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const quoteIndex = dayOfYear % dailyQuotes.length;
    return dailyQuotes[quoteIndex];
  };

  const quote = getDailyQuote();

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setShowContinue(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Show skip link after 10 seconds
  useEffect(() => {
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 10000);

    return () => clearTimeout(skipTimer);
  }, []);

  // Skip countdown
  useEffect(() => {
    if (!showSkip) return;

    const skipTimer = setInterval(() => {
      setSkipTimeLeft(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(skipTimer);
  }, [showSkip]);

  const handleDismiss = () => {
    // Store today's date in localStorage - scoped to user
    if (!username) {
      console.warn('DailyQuoteCard: username not available, skipping localStorage update');
      onDismiss();
      return;
    }
    
    const key = `lastQuoteDate_${username}`;
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(key, today);
    onDismiss();
  };

  const handleSkip = () => {
    handleDismiss();
  };

  // Calculate SVG circle progress
  const circumference = 2 * Math.PI * 45; // radius = 45
  const progress = (timeLeft / 15) * circumference;
  const strokeDashoffset = circumference - progress;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(27, 67, 50, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.5s ease-in',
      }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>

      <div
        style={{
          maxWidth: '700px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Circular countdown timer */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <svg width="100" height="100" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(201, 168, 76, 0.2)"
              strokeWidth="4"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#C9A84C"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
                transition: 'stroke-dashoffset 1s linear',
              }}
            />
            {/* Clock/crescent icon */}
            <text
              x="50"
              y="55"
              textAnchor="middle"
              fontSize="24"
              fill="#C9A84C"
              style={{ fontFamily: 'serif' }}
            >
              ☽
            </text>
          </svg>
        </div>

        {/* Arabic text */}
        <div
          style={{
            fontSize: '2.2rem',
            fontFamily: "'Amiri', serif",
            color: '#C9A84C',
            textAlign: 'right',
            marginBottom: '24px',
            lineHeight: 1.6,
            direction: 'rtl',
          }}
        >
          {quote.arabic}
        </div>

        {/* English text */}
        <div
          style={{
            fontSize: '1.1rem',
            color: '#F5F0E8',
            textAlign: 'center',
            marginBottom: '16px',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          {quote.english}
        </div>

        {/* Source */}
        <div
          style={{
            fontSize: '0.9rem',
            color: 'rgba(201, 168, 76, 0.7)',
            marginBottom: '40px',
          }}
        >
          {quote.source}
        </div>

        {/* Continue button */}
        {showContinue && (
          <button
            onClick={handleDismiss}
            style={{
              padding: '14px 32px',
              backgroundColor: '#C9A84C',
              color: '#1B4332',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'sans-serif',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#D4B860';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#C9A84C';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Continue to App →
          </button>
        )}

        {/* Skip link */}
        {showSkip && (
          <div
            style={{
              marginTop: '24px',
              fontSize: '0.85rem',
              color: 'rgba(245, 240, 232, 0.6)',
              cursor: 'pointer',
            }}
            onClick={handleSkip}
          >
            Skip in {skipTimeLeft}s...
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyQuoteCard;
