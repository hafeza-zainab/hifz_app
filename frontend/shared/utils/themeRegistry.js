const THEME_REGISTRY = {
    sky: {
        id: 'sky',
        name: 'Celestial Sky',
        icon: '🌌',
        tagline: 'Every act lights the heavens.',
        milestones: [
            { days: 0, emoji: '🌑', label: 'New Moon' },
            { days: 7, emoji: '🌒', label: 'Moonrise' },
            { days: 14, emoji: '🌓', label: 'First Quarter' },
            { days: 30, emoji: '🌕', label: 'Full Illumination' },
            { days: 100, emoji: '⭐', label: 'Star Navigator' },
            { days: 365, emoji: '✨', label: 'Celestial Being' }
        ]
    }
};
export const THEME_LIST = Object.values(THEME_REGISTRY);

export function resolveThemeId(themeId) {
    return THEME_REGISTRY[themeId] ? themeId : 'sky';
}
export function getTheme(themeId) {
    return THEME_REGISTRY[themeId] || THEME_REGISTRY.sky;
}

export function getCurrentMilestone(themeId, streak) {
    const theme = getTheme(themeId);
    if (!theme || !theme.milestones) return { emoji: '🌑', label: 'New Moon' };
    
    const milestones = theme.milestones.filter(m => m.days <= streak);
    if (milestones.length === 0) return theme.milestones[0];
    
    return milestones[milestones.length - 1];
}

export function getNextMilestone(themeId, streak) {
    const theme = getTheme(themeId);
    if (!theme || !theme.milestones) return null;
    
    return theme.milestones.find(m => m.days > streak) || null;
}