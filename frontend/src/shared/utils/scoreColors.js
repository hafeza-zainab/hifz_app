// shared/utils/scoreColors.js
// Single source of truth for score thresholds used in forms, analytics, and heatmap.
//
// Rating Scale (inclusive upper bounds):
//   poor      : score <= 2      → red
//   fair      : score <= 4      → orange
//   good      : score <= 6      → yellow
//   veryGood  : score <= 8      → light green
//   excellent : score >  8      → dark green

/**
 * Classify a numeric score into one of five tiers.
 * @param {number|string} score
 * @returns {'poor'|'fair'|'good'|'veryGood'|'excellent'}
 */
export const scoreCategory = (score) => {
  const s = Number(score);
  if (s <= 2) return 'poor';
  if (s <= 4) return 'fair';
  if (s <= 6) return 'good';
  if (s <= 8) return 'veryGood';
  return 'excellent';
};

const COLOR_MAP = {
  poor:      { text: '#DC2626', bg: '#FEE2E2', border: '#EF4444', label: 'Poor' },
  fair:      { text: '#EA580C', bg: '#FFEDD5', border: '#F97316', label: 'Fair' },
  good:      { text: '#CA8A04', bg: '#FEF9C3', border: '#EAB308', label: 'Good' },
  veryGood:  { text: '#16A34A', bg: '#DCFCE7', border: '#22C55E', label: 'Very Good' },
  excellent: { text: '#15803D', bg: '#BBF7D0', border: '#16A34A', label: 'Excellent' },
};

/** Primary/foreground color for a score value. */
export const scoreColor = (score) => COLOR_MAP[scoreCategory(score)].text;

/** Light background fill for a score value. */
export const scoreBgColor = (score) => COLOR_MAP[scoreCategory(score)].bg;

/** Border/outline color for a score value. */
export const scoreBorderColor = (score) => COLOR_MAP[scoreCategory(score)].border;

/** Human-readable label for a score value. */
export const scoreLabel = (score) => COLOR_MAP[scoreCategory(score)].label;

/**
 * Convenience: returns all four values at once.
 * Useful when a component needs multiple properties for the same score.
 *
 * @example
 * const { text, bg, border, label } = scoreStyle(entry.score);
 */
export const scoreStyle = (score) => COLOR_MAP[scoreCategory(score)];