// shared/components/StreakBanner.jsx
import React, { useState, useEffect } from 'react';
import { getStreak } from '../services/taskApi';
import '../../styles/StreakBanner.css';

/**
 * Returns the 0-based day-of-year index for today.
 * Uses UTC to be consistent regardless of the user's timezone.
 * Fix: previous code subtracted a Date at midnight from a Date at current time,
 * causing the index to advance mid-day instead of at midnight.
 */
function dayOfYearIndex() {
  const now = new Date();
  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 1);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - startOfYear) / 86_400_000);
}

// Themed tiers based on streak milestones
const STREAK_TIERS = [
  { minStreak: 0, title: "Getting Started", description: "Start your journey today", color: "#9CA3AF", emoji: "🌱" },
  { minStreak: 3, title: "Building Momentum", description: "You're on the right track", color: "#F59E0B", emoji: "⚡" },
  { minStreak: 7, title: "On Fire!", description: "Consistency is key", color: "#DC2626", emoji: "🔥" },
  { minStreak: 14, title: "Unstoppable", description: "Nothing can stop you", color: "#7C3AED", emoji: "💪" },
  { minStreak: 30, title: "Hifz Legend", description: "You've mastered consistency", color: "#059669", emoji: "👑" },
  { minStreak: 60, title: "Quran Master", description: "Truly exceptional dedication", color: "#1B4332", emoji: "🏆" },
  { minStreak: 100, title: "Immortal", description: "Your dedication is legendary", color: "#C9A84C", emoji: "⭐" },
];

const StreakBanner = () => {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getStreak().then((res) => {
      if (!cancelled && res?.success) setStreak(res.data.streak);
    });
    return () => { cancelled = true; };
  }, []);

  // Determine current tier
  const currentTier = STREAK_TIERS.slice().reverse().find(tier => streak >= tier.minStreak) || STREAK_TIERS[0];
  const nextTier = STREAK_TIERS.find(tier => tier.minStreak > streak);
  
  // Calculate progress toward next tier
  const progress = nextTier 
    ? Math.min(100, ((streak - currentTier.minStreak) / (nextTier.minStreak - currentTier.minStreak)) * 100)
    : 100;

  return (
    <div className="streak-banner" data-tour="streak-banner" style={{ background: currentTier.color }}>
      <div className="streak-info">
        <div className="streak-fire">{currentTier.emoji}</div>
        <div>
          <h2>{currentTier.emoji} {streak} Day Streak</h2>
          <p className="streak-tier-title">{currentTier.title}</p>
        </div>
      </div>
      {nextTier && (
        <div className="streak-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="progress-text">{nextTier.minStreak - streak} days to "{nextTier.title}"</p>
        </div>
      )}
    </div>
  );
};

export default StreakBanner;