//C:\quran-similarity-app\frontend\src\features\similarity\components\AyahDisplay.jsx
import React from 'react';
import { useAppContext } from '../../../shared/context/AppContext';
import '../../../styles/AyahDisplay.css';

export default function AyahDisplay() {
  const { sourceAyah, isLoading } = useAppContext();
  if (isLoading) return <div className="loading">Searching...</div>;
  if (!sourceAyah) return <div className="placeholder">Select an Ayah to begin</div>;
  return (
    <div className="source-ayah-card">
      <div className="card-header-banner">Source Ayah</div>
      <div className="source-ayah-meta">
        <span>Page no. - {sourceAyah.page}</span>
        <span>Surah no. {sourceAyah.surah} ({sourceAyah.name})</span>
        <span>Ayah no. - {sourceAyah.ayah}</span>
      </div>
      <div className="card-body"><div className="arabic-text" dir="rtl">{sourceAyah.text}</div></div>
    </div>
  );
}