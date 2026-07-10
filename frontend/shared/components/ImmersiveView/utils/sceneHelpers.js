// C:\quran-similarity-app\frontend\src\shared\components\ImmersiveView\utils\sceneHelpers.js

/**
 * Deterministic seeded random - never use Math.random in render
 */
export const srand = (seed) => {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
};

/**
 * Generate star shadows for CSS box-shadow
 */
export const makeStars = (
    count,
    seedBase = 0,
    width = 100,
    height = 100,
    color = '255,255,255',
    minSize = 1,
    maxSize = 2
) => {
    const shadows = [];
    for (let i = 0; i < count; i++) {
        const s = (seedBase + i) * 37 + 7;
        const x = (srand(s) * width).toFixed(2);
        const y = (srand(s + 500) * height).toFixed(2);
        const size = minSize + srand(s + 1000) * (maxSize - minSize);
        const alpha = (0.3 + srand(s + 2000) * 0.7).toFixed(2);
        shadows.push(`${x}vw ${y}vh 0 ${size}px rgba(${color},${alpha})`);
    }
    return shadows.join(',');
};

/**
 * Generate array of children with random positions
 */
export const generateArray = (count, seedBase, createStyle) => {
    return Array.from({ length: count }, (_, i) => ({
        id: `item-${seedBase}-${i}`,
        style: createStyle(i, seedBase)
    }));
};

/**
 * Common layer presets
 */
export const LAYER_PRESETS = {
    // Full-width background for parallax (prevents gaps)
    fullBackground: (gradient) => ({
        speed: 0,
        style: { background: gradient, width: '140%', left: '-20%' }
    }),

    // Stars layer
    stars: (count, seed = 0, height = 100) => ({
        speed: 0.08,
        style: {
            position: 'absolute', inset: 0,
            width: '2px', height: '2px',
            boxShadow: makeStars(count, seed, 140, height)
        }
    }),

    // Moon
    moon: (top, left, size = 50) => ({
        speed: 0.15,
        style: {
            position: 'absolute', top, left,
            width: `${size}px`, height: `${size}px`, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #fffde8 0%, #fef3c7 50%, #fcd34d 70%, transparent 85%)',
            boxShadow: `0 0 ${size * 0.6}px ${size * 0.3}px rgba(255,220,100,0.5), 0 0 ${size * 1.2}px ${size * 0.6}px rgba(255,200,80,0.2)`
        }
    }),

    // Ground
    ground: (height = 15, gradient) => ({
        speed: 0,
        style: {
            position: 'absolute', bottom: 0, width: '140%', left: '-20%', height: `${height}%`,
            background: gradient
        }
    }),

    // Cloud
    cloud: (top, left, width = 150, opacity = 0.7) => ({
        id: `cloud-${top}-${left}`,
        style: {
            position: 'absolute', top, left,
            width: `${width}px`, height: `${width * 0.3}px`,
            borderRadius: '50px',
            background: `rgba(255,255,255,${opacity})`,
            filter: 'blur(8px)'
        }
    }),

    // Emoji element
    emoji: (id, content, bottom, left, size = 40, dropShadow = '0 4px 8px rgba(0,0,0,0.3)') => ({
        id,
        style: {
            position: 'absolute', bottom, left,
            fontSize: `${size}px`,
            lineHeight: 1,
            filter: `drop-shadow(${dropShadow})`
        },
        content
    }),

    // Animated emoji
    animatedEmoji: (id, content, bottom, left, size, animation, dropShadow, delay = 0) => ({
        id,
        style: {
            position: 'absolute', bottom, left,
            fontSize: `${size}px`,
            lineHeight: 1,
            filter: `drop-shadow(${dropShadow})`,
            animation: `${animation} ${3 + delay}s ease-in-out infinite ${delay}s`,
            transformOrigin: 'top center'
        },
        content
    }),

    // Light glow effect
    glowPool: (id, left, bottom, width = 8, height = 10, color = '255,140,20') => ({
        id,
        style: {
            position: 'absolute', left, bottom,
            width: `${width}%`, height: `${height}%`,
            background: `radial-gradient(ellipse, rgba(${color},0.15) 0%, transparent 70%)`,
            filter: 'blur(8px)'
        }
    })
};

// ══════════════════════════════════════════════════════════════
// STAR HELPERS for Celestial Sky theme
// ══════════════════════════════════════════════════════════════

// Star shape clip-path (5-pointed star)
const STAR_SHAPE = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';

/**
 * Generate background stars (tiny, organic, random)
 * Stars spawn from center and radiate outward
 */
export const generateBgStars = (count, seed = 0) => {
    const shadows = [];
    for (let i = 0; i < count; i++) {
        const s = (seed + i) * 37 + 7;
        // Generate stars starting from center and radiating outward
        const progress = i / count;
        const angle = srand(s) * Math.PI * 2;
        const maxRadius = 50; // Maximum radius from center (vh/vh units)
        const radius = 5 + progress * maxRadius + srand(s + 1) * 5;
        const x = (50 + Math.cos(angle) * radius).toFixed(2);
        const y = (50 + Math.sin(angle) * radius * 0.88).toFixed(2);
        const size = 1 + srand(s + 1000) * 2;
        const alpha = (0.2 + srand(s + 2000) * 0.6).toFixed(2);
        shadows.push(`${x}vh ${y}vh 0 ${size}px rgba(220,230,255,${alpha})`);
    }
    return shadows.join(',');
};

/**
 * Generate a single star element (star-shaped)
 */
export const createStarElement = (id, left, top, size, brightness, delay = 0) => ({
    id,
    style: {
        position: 'absolute',
        left,
        top,
        width: `${size}px`,
        height: `${size}px`,
        clipPath: STAR_SHAPE,
        background: `radial-gradient(circle, rgba(255,255,255,${brightness}) 0%, rgba(200,220,255,${brightness * 0.7}) 50%, transparent 100%)`,
        boxShadow: `0 0 ${size * 2}px ${size * 0.5}px rgba(200,220,255,${brightness * 0.3})`,
        animation: `star-twinkle ${2 + delay * 0.5}s ease-in-out infinite ${delay}s`
    }
});

/**
 * Generate milestone stars (unlocked by consistency)
 * Stars spawn from center and radiate outward based on streak progress
 */
export const generateMilestoneStars = (streak) => {
    const stars = [];
    const maxStars = Math.min(streak, 365);

    for (let i = 0; i < maxStars; i++) {
        // Stars radiate outward from center based on their index
        const progress = i / maxStars;
        const angle = srand(i * 37 + 7) * Math.PI * 2;
        const maxRadius = 40;
        const radius = 5 + progress * maxRadius + srand(i * 53 + 1) * 5;
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * radius * 0.88;
        const size = 6 + (i % 5) * 2;
        const brightness = 0.6 + (i % 3) * 0.2;

        stars.push(createStarElement(
            `milestone-${i}`,
            `${x}%`,
            `${y}%`,
            size,
            brightness,
            i * 0.3
        ));
    }

    return stars;
};

/**
 * Generate multiple constellations across the sky
 */
export const generateConstellations = (count = 1) => {
    const constellations = [];
    const baseShapes = [
        [{ x: 18, y: 25 }, { x: 28, y: 20 }, { x: 35, y: 28 }, { x: 42, y: 22 }, { x: 50, y: 30 }],
        [{ x: 10, y: 55 }, { x: 18, y: 48 }, { x: 26, y: 52 }, { x: 34, y: 46 }, { x: 42, y: 54 }],
        [{ x: 60, y: 15 }, { x: 68, y: 12 }, { x: 75, y: 20 }, { x: 83, y: 18 }, { x: 90, y: 25 }],
        [{ x: 65, y: 45 }, { x: 72, y: 40 }, { x: 79, y: 47 }, { x: 86, y: 42 }, { x: 92, y: 50 }]
    ];

    const normalize = (point, offsetX, offsetY, scale) => ({
        x: offsetX + (point.x - 50) * scale,
        y: offsetY + (point.y - 50) * scale
    });

    for (let i = 0; i < Math.min(count, 12); i++) {
        const shape = baseShapes[i % baseShapes.length];
        const offsetX = 10 + (i % 4) * 22;
        const offsetY = 10 + Math.floor(i / 4) * 24;
        const scale = 0.75 + (i % 3) * 0.12;
        const idPrefix = `const-${i}`;

        const points = shape.map((point) => normalize(point, offsetX, offsetY, scale));

        points.forEach((p, j) => {
            const size = 8 + (j % 2) * 3;
            const brightness = 0.85 + (j % 3) * 0.1;
            const delay = (i + j) * 0.2;
            constellations.push(createStarElement(
                `${idPrefix}-star-${j}`,
                `${p.x}%`,
                `${p.y}%`,
                size,
                brightness,
                delay
            ));
        });

        for (let j = 0; j < points.length - 1; j++) {
            const p1 = points[j];
            const p2 = points[j + 1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            constellations.push({
                id: `${idPrefix}-line-${j}`,
                style: {
                    position: 'absolute',
                    left: `${p1.x}%`,
                    top: `${p1.y}%`,
                    width: `${length}%`,
                    height: '2px',
                    background: 'linear-gradient(90deg, rgba(100,200,255,0.7), rgba(200,220,255,0.5))',
                    transformOrigin: '0 50%',
                    transform: `rotate(${angle}deg)`,
                    opacity: 1,
                    filter: 'drop-shadow(0 0 3px rgba(100,200,255,0.6))'
                }
            });
        }
    }

    return constellations;
};

/**
 * Generate shooting star elements
 */
export const generateShootingStars = (count, seed = 0) => {
    return Array.from({ length: count }, (_, i) => {
        const s = (seed + i) * 47 + 1;
        const top = 5 + srand(s) * 40;
        const left = 5 + srand(s + 200) * 60;
        const angle = -20 + srand(s + 300) * 40;
        const duration = 3 + srand(s + 400) * 3;

        return {
            id: `shooting-${i}`,
            speed: 0.25 + i * 0.05,
            style: {
                position: 'absolute',
                top: `${top}%`,
                left: `${left}%`,
                width: `${100 + i * 20}px`,
                height: '2px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 30%, rgba(200,220,255,0.6) 60%, transparent 100%)',
                transform: `rotate(${angle}deg)`,
                animation: `shooting-star-move ${duration}s linear infinite ${i * 4}s`,
                opacity: 0.9
            }
        };
    });
};