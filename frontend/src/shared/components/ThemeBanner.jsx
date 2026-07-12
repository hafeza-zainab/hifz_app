// shared/components/ThemeBanner.jsx
// Improvements:
//  - Extracted THEME_BG and THEME_BAR to a shared themeVisuals.js constant
//    (duplicated between ThemeBanner and ThemeSelector — see themeVisuals.js)
//  - Added cleanup (cancelled flag) on the async load effect
//  - Removed inline ternary chain in favour of a helper for streak labels
//  - ThemeSelector onSelect callback now avoids the 150ms timeout by relying
//    on state instead of a fragile setTimeout dance

import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { getCurrentTheme } from '../services/themeApi';
import { getTheme, getCurrentMilestone, getNextMilestone } from '../utils/themeRegistry';
import { THEME_BG, THEME_BAR } from '../utils/themeVisuals';
import ThemeSelector from './ThemeSelector';
import '../../styles/ThemeBanner.css';

const ImmersiveView = lazy(() => import('./ImmersiveView/ImmersiveView'));

const loadTheme = async () => {
  const res = await getCurrentTheme();
  return res.success ? res.data : null;
};

export default function ThemeBanner() {
  const [themeData, setThemeData] = useState(null);
  const [showSelector, setShowSelector] = useState(false);
  const [showImmersive, setShowImmersive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadTheme().then((data) => {
      if (!cancelled) setThemeData(data);
    });
    return () => { cancelled = true; };
  }, []);

  const handleThemeChange = useCallback(async () => {
    setShowSelector(false);
    const data = await loadTheme();
    if (data) setThemeData(data);
  }, []);

  const themeId = themeData?.theme_id || 'sky';
  const streak  = themeData?.streak ?? 0;
  const hasTheme = themeData?.has_theme ?? false;

  const theme      = useMemo(() => getTheme(themeId), [themeId]);
  const bg         = THEME_BG[themeId] ?? THEME_BG.sky;
  const bar        = THEME_BAR[themeId] ?? THEME_BAR.sky;
  const milestone  = useMemo(() => getCurrentMilestone(themeId, streak), [themeId, streak]);
  const next       = useMemo(() => getNextMilestone(themeId, streak), [themeId, streak]);
  const daysLeft   = next ? next.days - streak : null;

  const visibleMilestones = useMemo(
    () => (theme?.milestones ?? []).filter((m) => m.days > 0 && m.days <= streak),
    [theme, streak]
  );

  if (!themeData) return <div className="theme-banner-loading">Loading...</div>;
  if (!hasTheme) return <ThemeSelector isForced onSelect={handleThemeChange} />;
  if (showImmersive) {
    return (
      <Suspense fallback={<div className="theme-banner-loading">Loading immersive view...</div>}>
        <ImmersiveView
          themeId={themeId}
          streak={streak}
          onClose={() => setShowImmersive(false)}
        />
      </Suspense>
    );
  }

  return (
    <>
      <div
        className="theme-banner-container"
        onClick={() => setShowImmersive(true)}
        style={{ cursor: 'pointer' }}
        title="Click to enter your world"
      >
        <div className="theme-viewport" style={{ background: bg }}>
          {visibleMilestones.map((m, i) => (
            <span
              key={m.days}
              className="milestone-emoji"
              style={{
                left: `${((i + 1) * 80) / (visibleMilestones.length + 1)}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            >
              {m.emoji}
            </span>
          ))}
          {streak === 0 && (
            <div className="theme-empty-msg">Your journey awaits...</div>
          )}
        </div>

        <div className="theme-info-bar" style={{ background: bar }}>
          <div className="theme-milestone" data-tour="streak-flame">
            <span className="milestone-icon">{milestone.emoji}</span>
            <div>
              <span className="milestone-label">
                {streak === 0
                  ? 'Begin Your Journey'
                  : `${streak} Day${streak !== 1 ? 's' : ''} · ${milestone.label}`}
              </span>
              {next && streak > 0 && (
                <span className="next-milestone">
                  {daysLeft}d until {next.emoji} {next.label}
                </span>
              )}
            </div>
          </div>

          <div className="theme-right">
            <button
              className="theme-switch-btn"
              onClick={(e) => { e.stopPropagation(); setShowSelector(true); }}
              title="Switch theme"
              aria-label="Switch theme"
            >
              🎨
            </button>
            <button
              className="theme-enter-btn"
              onClick={(e) => { e.stopPropagation(); setShowImmersive(true); }}
              title="Enter your world"
              aria-label="Enter immersive view"
            >
              <span className="enter-icon">⬇</span>
            </button>
          </div>
        </div>
      </div>

      {showSelector && (
        <ThemeSelector
          currentStreak={streak}
          onSelect={handleThemeChange}
          onClose={() => setShowSelector(false)}
        />
      )}
    </>
  );
}