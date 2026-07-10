// C:\quran-similarity-app\frontend\src\shared\components\ImmersiveView\ImmersiveView.jsx
// Main immersive view component that dispatches to either a canvas-based or layered scene based on the theme.
// The LayerScene contains all the hooks and logic for parallax and HUD, while canvas scenes are self-contained.
// Only the Sky theme is supported. All other theme IDs will fall back to Sky.

import React, { useState, useEffect, useMemo } from 'react';
import { getTheme, resolveThemeId } from '../../utils/themeRegistry';
import useParallax from './hooks/useParallax';
import SCENES from './scenes';
import './ImmersiveView.css';

// ═══════════════════════════════════════════════════════════════
// Dispatcher — hook-free, just picks the right renderer.
// Only SCENES.sky is registered; unknown themeIds fall back to it.
// ═══════════════════════════════════════════════════════════════
export default function ImmersiveView({ themeId, streak = 0, onClose }) {
    const normalizedThemeId = resolveThemeId(themeId);
    const meta = getTheme(normalizedThemeId);
    const SceneModule = SCENES[normalizedThemeId] || SCENES.sky;

    if (SceneModule?.isCanvasScene) {
        return <SceneModule streak={streak} onClose={onClose} />;
    }

    return (
        <LayerScene
            sceneModule={SceneModule}
            meta={meta}
            streak={streak}
            onClose={onClose}
        />
    );
}


// ═══════════════════════════════════════════════════════════════
// Layer Scene — ALL hooks live here, unconditionally
// ═══════════════════════════════════════════════════════════════
function LayerScene({ sceneModule, meta, streak, onClose }) {
    const [visible, setVisible] = useState(false);
    const { position, touchHandlers } = useParallax({ visible, onClose });

    const layers = useMemo(() => sceneModule({ streak }), [sceneModule, streak]);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(timer);
    }, []);

    const milestones = meta.milestones || [];
    const milestone = milestones.reduce(
        (best, m) => streak >= m.days ? m : best,
        milestones[0] || { emoji: '🌑', label: 'Beginning', days: 0 }
    );
    const next = milestones.find(m => streak < m.days) || null;

    if (!visible) return null;

    return (
        <div className="immersive-overlay immersive-enter">
            <div className="immersive-scene">
                {layers.map(layer => (
                    <div
                        key={layer.id}
                        className="immersive-layer"
                        style={{
                            ...layer.style,
                            transform: `translate(${position.x * (layer.speed || 0)}px, ${position.y * (layer.speed || 0)}px)`,
                            willChange: 'transform'
                        }}
                    >
                        {layer.children?.map((child, idx) => (
                            <div key={child.id || idx} style={child.style}>
                                {child.content}
                            </div>
                        ))}
                        {layer.content && layer.content}
                    </div>
                ))}

                <div className="immersive-hud">
                    <button className="immersive-close" onClick={onClose} title="Close (Esc)">✕</button>

                    <div className="immersive-hud-left">
                        <span className="hud-icon">{meta.icon}</span>
                        <span className="hud-name">{meta.name.toUpperCase()}</span>
                    </div>

                    <div className="immersive-hud-center">
                        <div className="hud-streak">{streak} Day{streak !== 1 ? 's' : ''}</div>
                        <div className="hud-milestone">{milestone.emoji} {milestone.label}</div>
                    </div>

                    <div className="immersive-hud-right">
                        {next && (
                            <div className="hud-next">
                                Next: {next.emoji} at {next.days}d
                            </div>
                        )}
                        <div className="hud-tagline">{meta.tagline}</div>
                    </div>
                </div>

                <div className="immersive-controls-hint">
                    Arrow keys to navigate · Esc to close
                </div>

                <div className="immersive-touch-area" {...touchHandlers} />
            </div>
        </div>
    );
}