// shared/components/ThemeSelector.jsx
// Improvements:
//  - Imports THEME_BG from themeVisuals.js instead of duplicating the object
//  - Added cancellation flag to the async load effect
//  - Replaced the PREVIEW_STREAKS label ternary with a named helper
//  - Removed redundant `can_switch` prop that was never used after ThemeBanner refactor

import React, { useState, useEffect } from 'react';
import { getAllThemes, selectTheme, checkPreview } from '../services/themeApi';
import { THEME_LIST } from '../utils/themeRegistry';
import { getThemeBg } from '../utils/themeVisuals';
import '../../styles/ThemeSelector.css';

/** Label shown in the preview grid for a given preview-streak value. */
function previewLabel(days) {
  if (days >= 365) return '1 Year';
  if (days >= 100) return 'Advanced';
  if (days >= 30)  return 'Growing';
  return 'Beginning';
}

const PREVIEW_STREAKS = {
  sky: 100,
};

export default function ThemeSelector({ isForced, onSelect, onClose }) {
  const [mode, setMode]           = useState('preview');
  const [userThemes, setUserThemes] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [previewRes, themesRes] = await Promise.all([
        checkPreview(),
        getAllThemes(),
      ]);
      if (cancelled) return;
      if (themesRes.success) setUserThemes(themesRes.data.themes ?? []);
      if (previewRes.success && previewRes.data.alreadySelected) setMode('select');
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSelect = async (themeId) => {
    setLoading(true);
    setError('');
    const res = await selectTheme(themeId);
    if (res.success) {
      onSelect();
    } else {
      setError(res.message || 'Failed to switch theme.');
    }
    setLoading(false);
  };

  const getUserProgress = (themeId) => {
    const ut = userThemes.find((t) => t.theme_id === themeId);
    return {
      streak: ut?.streak ?? 0,
      max: ut?.max_streak ?? 0,
      isActive: ut?.is_active === 1,
    };
  };

  if (mode === 'preview') {
    return (
      <div className="theme-selector-overlay">
        <div className="theme-selector-modal">
          <div className="ts-header">
            <div>
              <h2>Explore Your Journey</h2>
              <p className="ts-subtitle">Each theme evolves differently over time</p>
            </div>
          </div>

          <div className="ts-grid ts-preview-grid">
            {THEME_LIST.map((theme) => (
              <div key={theme.id} className="ts-preview-card">
                <div
                  className="ts-preview-large"
                  style={{ background: getThemeBg(theme.id) }}
                >
                  <span className="ts-preview-icon">{theme.icon}</span>
                  <div className="ts-preview-label">
                    {previewLabel(PREVIEW_STREAKS[theme.id] ?? 0)}
                  </div>
                </div>
                <div className="ts-info">
                  <div className="ts-name">{theme.name}</div>
                  <div className="ts-tagline">{theme.tagline}</div>
                  <div className="ts-milestone-list">
                    {theme.milestones.filter((m) => m.days > 0).map((m) => (
                      <span key={m.days} className="ts-milestone-chip">
                        {m.emoji} {m.days}d
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="ts-footer">
            <button className="ts-continue-btn" onClick={() => setMode('select')}>
              Choose Your Theme →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="theme-selector-overlay"
      onClick={!isForced ? onClose : undefined}
    >
      <div className="theme-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ts-header">
          <div>
            <h2>{isForced ? 'Choose Your Theme' : 'Switch Theme'}</h2>
            <p className="ts-subtitle">Your progress is saved — switch anytime</p>
          </div>
          {!isForced && (
            <button className="ts-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>

        {error && <div className="ts-error">{error}</div>}

        <div className="ts-grid">
          {THEME_LIST.map((theme) => {
            const { streak: displayStreak, isActive } = getUserProgress(theme.id);
            const milestone = theme.milestones
              .filter((m) => m.days > 0)
              .reduce(
                (best, m) => (displayStreak >= m.days ? m : best),
                theme.milestones[0]
              );

            return (
              <button
                key={theme.id}
                className={`ts-card ${isActive ? 'ts-active' : ''}`}
                onClick={() => !isActive && !loading && handleSelect(theme.id)}
                disabled={isActive || loading}
                aria-pressed={isActive}
              >
                <div
                  className="ts-preview"
                  style={{ background: getThemeBg(theme.id) }}
                >
                  {isActive && <span className="ts-active-badge">Active</span>}
                  <span className="ts-preview-emoji">{theme.icon}</span>
                </div>
                <div className="ts-info">
                  <div className="ts-name">{theme.name}</div>
                  <div className="ts-tagline">{theme.tagline}</div>
                  {displayStreak > 0 && (
                    <div className="ts-progress">
                      <div className="ts-progress-bar">
                        <div
                          className="ts-progress-fill"
                          style={{ width: `${Math.min((displayStreak / 365) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="ts-progress-text">
                        {displayStreak} days · {milestone.emoji}
                      </span>
                    </div>
                  )}
                  {isActive && (
                    <div className="ts-current-info">
                      Active · {milestone.emoji} {milestone.label}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {loading && <div className="ts-loading-overlay">Switching...</div>}
      </div>
    </div>
  );
}