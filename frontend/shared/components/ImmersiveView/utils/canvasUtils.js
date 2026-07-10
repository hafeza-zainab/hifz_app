//C:\quran-similarity-app\frontend\src\shared\components\ImmersiveView\utils\canvasUtils.js
/**
 * canvasUtils.js
 * ─────────────────────────────────────────────────────────────
 * Pure drawing helpers shared by Sky and any future canvas scenes.
 * No React, no state — just functions.
 */

// ═══════════════════════════════════════════════════════════════
// MATH UTILITIES
// ═══════════════════════════════════════════════════════════════

/** Seeded pseudo-random (deterministic, same as scenes) */
export const sr = (s) => { const x = Math.sin(s + 1) * 43758.5453; return x - Math.floor(x); };

export const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
export const lerp  = (a, b, t)   => a + (b - a) * t;

/**
 * Convert a normalized (0-1) position to canvas pixels
 * applying parallax camera offset.
 */
export const toScreen = (nx, ny, depth, W, H, camX, camY) => [
    nx * W - camX * depth,
    ny * H - camY * depth,
];

// ═══════════════════════════════════════════════════════════════
// VIGNETTE  (used by Sky)
// ═══════════════════════════════════════════════════════════════

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W
 * @param {number} H
 * @param {object} [opts]
 * @param {number} [opts.cx=0.5]       focal X (0-1)
 * @param {number} [opts.cy=0.5]       focal Y (0-1)
 * @param {number} [opts.innerR=0.32]  clear radius (0-1 of min dimension)
 * @param {number} [opts.outerR=0.78]  dark radius
 * @param {number} [opts.maxAlpha=0.38]
 */
export function drawVignette(ctx, W, H, opts = {}) {
    const { cx = 0.5, cy = 0.5, innerR = 0.32, outerR = 0.78, maxAlpha = 0.38 } = opts;
    const vg = ctx.createRadialGradient(
        W * cx, H * cy, Math.min(W, H) * innerR,
        W * cx, H * cy, Math.max(W, H) * outerR,
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.6, `rgba(0,0,0,${(maxAlpha * 0.1).toFixed(3)})`);
    vg.addColorStop(1, `rgba(0,0,0,${maxAlpha})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
}

// ═══════════════════════════════════════════════════════════════
// ROUNDED RECT
// ═══════════════════════════════════════════════════════════════

export function roundedRect(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

// ═══════════════════════════════════════════════════════════════
// STAR SHAPE  (used by Sky scene)
// ═══════════════════════════════════════════════════════════════

/**
 * Draw a star polygon with optional cross-hair spikes for large stars.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} outer  - outer radius
 * @param {number} inner  - inner radius
 * @param {number} spikes - number of points
 * @param {number[]} col  - [r, g, b]
 * @param {number} alpha
 */
export function drawStar(ctx, x, y, outer, inner, spikes, col, alpha) {
    if (alpha < 0.02) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = `rgb(${col[0]},${col[1]},${col[2]})`;
    ctx.shadowColor = `rgba(${col[0]},${col[1]},${col[2]},0.85)`;
    ctx.shadowBlur  = outer * 4;

    let a = -Math.PI / 2;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * outer, y + Math.sin(a) * outer);
    for (let i = 0; i < spikes * 2; i++) {
        a += step;
        const r = (i % 2 === 0) ? inner : outer;
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();

    if (outer > 4.5) {
        ctx.globalAlpha = alpha * 0.28;
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},0.7)`;
        ctx.lineWidth   = 0.5;
        const sp = outer * 5;
        ctx.beginPath(); ctx.moveTo(x - sp, y); ctx.lineTo(x + sp, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y - sp); ctx.lineTo(x, y + sp); ctx.stroke();
    }
    ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
// ATMOSPHERIC HAZE
// ═══════════════════════════════════════════════════════════════

/**
 * Soft atmospheric horizon glow.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W
 * @param {number} H
 * @param {number} horizonY  - Y fraction (0-1) for horizon
 * @param {string} [tint='200,220,240']  - CSS color components
 */
export function drawAtmosphericHaze(ctx, W, H, horizonY = 0.40, tint = '200,220,240') {
    const hg = ctx.createLinearGradient(0, H * (horizonY - 0.06), 0, H * (horizonY + 0.06));
    hg.addColorStop(0,   `rgba(${tint},0.0)`);
    hg.addColorStop(0.4, `rgba(${tint},0.14)`);
    hg.addColorStop(0.8, `rgba(${tint},0.22)`);
    hg.addColorStop(1,   `rgba(${tint},0.0)`);
    ctx.fillStyle = hg;
    ctx.fillRect(0, H * (horizonY - 0.06), W, H * 0.12);
}

// ═══════════════════════════════════════════════════════════════
// GENERIC SKY GRADIENT  (shared starting point)
// ═══════════════════════════════════════════════════════════════

/**
 * Fill rect with a top-to-bottom linear gradient.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W
 * @param {number} H
 * @param {Array<[number, string]>} stops  - [[offset, color], …]
 * @param {number} [yEnd=H]
 */
export function drawGradientRect(ctx, W, H, stops, yEnd) {
    const g = ctx.createLinearGradient(0, 0, 0, yEnd ?? H);
    stops.forEach(([offset, color]) => g.addColorStop(offset, color));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, yEnd ?? H);
}

// ═══════════════════════════════════════════════════════════════
// SIMPLE CLOUD PUFF  (generic, usable in any scene)
// ═══════════════════════════════════════════════════════════════

/**
 * Draw a single fluffy cloud at (cx, cy).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} w   - half-width
 * @param {number} h   - half-height
 * @param {number} alpha
 * @param {boolean} warm  - golden/warm tint vs cool white
 */
export function drawCloudPuff(ctx, cx, cy, w, h, alpha, warm = false) {
    ctx.save();
    ctx.globalAlpha = alpha;

    const BUMPS = [
        [0,         0,          w,       h      ],
        [-w * 0.48, h * 0.38,   w * 0.62, h * 0.9],
        [ w * 0.42, h * 0.30,   w * 0.55, h * 0.8],
        [-w * 0.18, -h * 0.18,  w * 0.45, h * 0.7],
    ];
    BUMPS.forEach(([ox, oy, rx, ry]) => {
        const g = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, Math.max(rx, ry));
        if (warm) {
            g.addColorStop(0, 'rgba(255,248,220,0.97)');
            g.addColorStop(0.45,'rgba(245,230,200,0.80)');
            g.addColorStop(1, 'rgba(210,190,160,0)');
        } else {
            g.addColorStop(0, 'rgba(240,248,255,0.94)');
            g.addColorStop(0.45,'rgba(210,228,248,0.78)');
            g.addColorStop(1, 'rgba(180,205,230,0)');
        }
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(cx + ox, cy + oy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}