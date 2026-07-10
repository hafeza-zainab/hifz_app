//C:\quran-similarity-app\frontend\src\shared\components\Walkthrough.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTour } from '../context/TourContext';

export default function Walkthrough({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { startTour, completeTour } = useTour();

  const handleStartTour = () => {
    startTour();
    navigate('/similarity');
    onClose();
  };

  const handleSkip = () => {
    completeTour();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 9999,
        }}
        onClick={onClose}
      />

      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000,
          maxWidth: '450px',
          minWidth: '320px',
          backgroundColor: '#F5F0E8',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: '2px solid #C9A84C',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              marginBottom: '16px',
            }}
          >
            📖
          </div>
        </div>

        <h2
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#1B4332',
            marginBottom: '16px',
            marginTop: 0,
            textAlign: 'center',
          }}
        >
          Welcome to Hifz al-Quran Platform
        </h2>

        <div
          style={{
            fontSize: '15px',
            lineHeight: '1.7',
            color: '#374151',
            marginBottom: '28px',
            textAlign: 'center',
          }}
        >
          This platform helps you memorize and retain the Quran through smart tools, AI coaching, and personalized scheduling. Let us guide you through an interactive tour of the platform's features.
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handleSkip}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '2px solid #2D6A4F',
              backgroundColor: 'transparent',
              color: '#2D6A4F',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Skip for now
          </button>
          <button
            onClick={handleStartTour}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#C9A84C',
              color: '#1B4332',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Start Interactive Tour
          </button>
        </div>
      </div>
    </>
  );
}
