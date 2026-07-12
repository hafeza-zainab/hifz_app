// shared/utils/themeVisuals.js
// Centralises the visual constants (background gradients, bar colours) that were
// previously copy-pasted identically in both ThemeBanner.jsx and ThemeSelector.jsx.
// Import from here in both components.

export const THEME_BG = {
  sky:      'linear-gradient(180deg, #06060e 0%, #0c0c20 50%, #080818 100%)',
  forest:   'linear-gradient(180deg, #071407 0%, #0a1f0a 50%, #051505 100%)',
  mountain: 'linear-gradient(180deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)',
  oasis:    'linear-gradient(180deg, #fbbf24 0%, #f59e0b 40%, #d97706 100%)',
  ship:     'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 40%, #0369a1 100%)',
};

export const THEME_BAR = {
  sky:      'rgba(6,6,20,0.92)',
  forest:   'rgba(5,21,5,0.92)',
  mountain: 'rgba(30,40,55,0.92)',
  oasis:    'rgba(100,60,10,0.92)',
  ship:     'rgba(8,50,90,0.92)',
};

/** Safely look up a background gradient, falling back to sky. */
export const getThemeBg  = (themeId) => THEME_BG[themeId]  ?? THEME_BG.sky;

/** Safely look up an info-bar colour, falling back to sky. */
export const getThemeBar = (themeId) => THEME_BAR[themeId] ?? THEME_BAR.sky;