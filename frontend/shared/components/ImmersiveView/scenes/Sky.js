// scenes/Sky.js

import React, { useRef, useEffect, useMemo } from 'react';
import useCanvasScene from '../hooks/useCanvasScene';
import { sr, toScreen, drawStar } from '../utils/canvasUtils';

// ═══════════════════════════════════════════════════════════════
const STAR_COLS = [
    [220, 235, 255], [200, 215, 255], [180, 205, 255],
    [255, 255, 248], [255, 248, 215], [215, 240, 255], [255, 230, 190]
];

const CDEFS = [
    { name: 'Orion', pts: [
        [0, 60], [18, 40], [35, 30], [52, 40], [70, 60],
        [18, 0], [52, 0], [35, 80], [10, 110], [60, 110]
    ]},
    { name: 'Ursa Major', pts: [
        [0, 40], [35, -15], [75, -10], [110, 5], [125, 38], [95, 65], [50, 55],
        [75, 10], [50, 30]
    ]},
    { name: 'Cassiopeia', pts: [
        [0, 30], [38, -15], [72, 30], [108, -15], [144, 30]
    ]},
    { name: 'Scorpius', pts: [
        [0, 0], [18, 28], [10, 62], [-8, 95], [-25, 125],
        [12, 138], [48, 128], [68, 98], [78, 58], [58, 18]
    ]},
    { name: 'Crux', pts: [
        [28, 0], [28, 75], [0, 38], [56, 38]
    ]},
    { name: 'Lyra', pts: [
        [0, 0], [22, 32], [58, 32], [80, 0], [40, -22], [0, 0]
    ]},
    { name: 'Cygnus', pts: [
        [0, 0], [22, 42], [44, 85], [22, 42], [-8, 72], [52, 72]
    ]},
    { name: 'Taurus', pts: [
        [0, 0], [38, -10], [72, 0], [92, 28], [72, 55], [38, 18], [-18, 28]
    ]},
    { name: 'Gemini', pts: [
        [0, 0], [0, 82], [22, 0], [22, 82]
    ]},
    { name: 'Andromeda', pts: [
        [0, 0], [38, 20], [78, 48], [118, 65], [78, 28], [100, -12]
    ]},
    { name: 'Pegasus', pts: [
        [0, 0], [78, 0], [78, 78], [0, 78], [0, 0], [40, -22], [78, -30]
    ]},
    { name: 'Aquila', pts: [
        [0, 0], [28, 20], [56, 10], [38, 52], [18, 75], [-5, 55]
    ]}
];

const CGRID = [
    [0.10, 0.10], [0.36, 0.07], [0.62, 0.10], [0.88, 0.09],
    [0.08, 0.38], [0.34, 0.36], [0.60, 0.34], [0.86, 0.38],
    [0.12, 0.62], [0.38, 0.60], [0.63, 0.63], [0.87, 0.62]
];

const NEBULA_DEF = [
    { name: 'Orion Nebula',  gx: 0.27, gy: 0.45, hue: 270, hue2: 300, r: 0.145, drift: 0.0013 },
    { name: 'Lagoon Nebula', gx: 0.73, gy: 0.52, hue: 320, hue2: 280, r: 0.115, drift: 0.0008 }
];

const CRATERS = [
    [-0.29, -0.19, 0.11], [0.20, 0.30, 0.07], [-0.08, 0.40, 0.055],
    [0.34, -0.10, 0.065], [-0.40, 0.13, 0.09], [0.10, -0.34, 0.045],
    [0.22, -0.22, 0.055], [-0.18, 0.18, 0.07], [0.38, 0.22, 0.05]
];

const MILESTONES = [
    { d: 0,   e: '🌑', l: 'New Moon' },
    { d: 7,   e: '🌒', l: 'First Shooting Star' },
    { d: 14,  e: '🌓', l: 'Quarter Moon' },
    { d: 28,  e: '🌕', l: 'First Constellation' },
    { d: 56,  e: '⭐', l: 'Two Constellations' },
    { d: 100, e: '🌟', l: 'Star Navigator' },
    { d: 180, e: '🌌', l: 'Nebula Witness' },
    { d: 365, e: '✨', l: 'Celestial Being' }
];

// ═══════════════════════════════════════════════════════════════
// BUILD FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function prebuildStars() {
    const stars = [];
    for (let i = 0; i < 365; i++) {
        const seed = i * 137 + 3;
        const progress = i / 365;
        const angle = sr(seed) * Math.PI * 2;
        const maxRadius = 0.45;
        const radius = 0.05 + progress * maxRadius + sr(seed + 1) * 0.05;
        const nx = 0.5 + Math.cos(angle) * radius;
        const ny = 0.5 + Math.sin(angle) * radius * 0.88;
        stars.push({
            nx: Math.max(0.05, Math.min(0.95, nx)),
            ny: Math.max(0.05, Math.min(0.88, ny)),
            size: 1.8 + sr(seed + 2) * 5.2,
            alpha: 0.55 + sr(seed + 3) * 0.45,
            bspd: 0.014 + sr(seed + 4) * 0.036,
            boff: sr(seed + 5) * Math.PI * 2,
            col: STAR_COLS[Math.floor(sr(seed + 6) * STAR_COLS.length)], 
            depth: 0.12 + sr(seed + 7) * 0.52
        });
    }
    return stars;
}


function buildShoots(streak) {
    const shoots = [];
    const n = Math.min(Math.floor(streak / 7), 52);
    for (let i = 0; i < n; i++) {
        const seed = i * 83 + 500;
        const col = i % 13;
        const row = Math.floor(i / 13);
        shoots.push({
            nx: 0.05 + (col / 12) * 0.90 + (sr(seed) - 0.5) * 0.05,
            ny: 0.04 + (row / 4) * 0.45 + (sr(seed + 1) - 0.5) * 0.04,
            angle: (20 + sr(seed + 2) * 45) * Math.PI / 180,
            speed: 2.8 + sr(seed + 3) * 3.2,
            len: 70 + sr(seed + 4) * 110,
            period: 300 + Math.floor(sr(seed + 5) * 200),
            offset: Math.floor(i * 73 + sr(seed + 6) * 60),
            col: [205 + sr(seed + 7) * 50, 215 + sr(seed + 8) * 40, 255],
            depth: 0.25 + sr(seed + 9) * 0.45
        });
    }
    return shoots;
}

function buildConsts(streak) {
    const consts = [];
    const n = Math.min(Math.floor(streak / 28), 12);
    for (let i = 0; i < n; i++) {
        const seed = i * 211 + 7;
        const sc = 0.85 + sr(seed) * 0.45;
        consts.push({
            name: CDEFS[i].name,
            num: i + 1,
            pts: CDEFS[i].pts.map(([x, y]) => [x * sc, y * sc]),
            gx: CGRID[i][0],
            gy: CGRID[i][1],
            depth: 0.18 + sr(seed + 1) * 0.28,
            alpha: 0
        });
    }
    return consts;
}

function buildNebulae(streak) {
    const nebulae = [];
    const n = Math.min(Math.floor(streak / 180), 2);
    for (let i = 0; i < n; i++) {
        nebulae.push({ ...NEBULA_DEF[i], angle: sr(i * 17) * Math.PI * 2 });
    }
    return nebulae;
}

// ═══════════════════════════════════════════════════════════════
// CANVAS DRAW HELPERS
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
const Sky = ({ streak = 0, onClose }) => {
    const stateRef = useRef({
        STARS: prebuildStars(),
        SHOOTS: buildShoots(streak),
        CONSTS: buildConsts(streak),
        NEBULAE: buildNebulae(streak),
        moonA: 0,
    });

    // ── Rebuild scene data when streak changes ──────────
    useEffect(() => {
        const s = stateRef.current;
        s.SHOOTS = buildShoots(streak);
        s.CONSTS = buildConsts(streak);
        s.NEBULAE = buildNebulae(streak);
    }, [streak]);

    const { canvasRef, camRef, frameRef, visible } = useCanvasScene({
        onClose,
        camMax: 160,
        camSpd: 3.8,
        camDamp: 0.965,
        onTick: (ctx, W, H) => {
            const s = stateRef.current;
            const frame = frameRef.current;
            const camX = camRef.current.x;
            const camY = camRef.current.y;

            // ── Background ─────────────────────────────
            const bg = ctx.createRadialGradient(
                W / 2, H * 0.38, 0,
                W / 2, H * 0.5, Math.max(W, H) * 0.78
            );
            bg.addColorStop(0, '#06072a');
            bg.addColorStop(0.4, '#040418');
            bg.addColorStop(1, '#010208');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            // ── Nebulae ────────────────────────────────
            for (let ni = 0; ni < s.NEBULAE.length; ni++) {
                const nb = s.NEBULAE[ni];
                nb.angle += nb.drift;
                const R = nb.r * Math.min(W, H);
                const [cx, cy] = toScreen(nb.gx, nb.gy * 0.86, 0.22, W, H, camX, camY);
                const driftX = Math.cos(nb.angle) * 22;
                const driftY = Math.sin(nb.angle * 1.35) * 14;

                for (let L = 0; L < 7; L++) {
                    const lR = R * (0.25 + L * 0.16);
                    const pulse = 0.45 + Math.sin(frame * 0.007 + L * 1.05) * 0.35;
                    const lA = (0.085 - L * 0.008) * pulse;
                    const ox = Math.cos(L * 1.4 + nb.angle * 0.6) * R * 0.28 + driftX * (1 - L * 0.1);
                    const oy = Math.sin(L * 1.0 + nb.angle * 0.4) * R * 0.22 + driftY * (1 - L * 0.1);
                    const g = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, lR);
                    const h = nb.hue + L * 14;
                    const h2 = nb.hue2 + L * 10;

                    if (L < 3) {
                        g.addColorStop(0, `hsla(${h},88%,68%,${(lA * 3).toFixed(3)})`);
                        g.addColorStop(0.25, `hsla(${h - 10},80%,52%,${(lA * 1.8).toFixed(3)})`);
                        g.addColorStop(0.55, `hsla(${h2},70%,35%,${(lA * 0.9).toFixed(3)})`);
                        g.addColorStop(1, 'hsla(0,0%,0%,0)');
                    } else {
                        g.addColorStop(0, `hsla(${h2},75%,55%,${(lA * 2).toFixed(3)})`);
                        g.addColorStop(0.4, `hsla(${h2 - 20},65%,38%,${(lA * 0.8).toFixed(3)})`);
                        g.addColorStop(1, 'hsla(0,0%,0%,0)');
                    }
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.ellipse(cx + ox, cy + oy, lR * 1.35, lR * 0.7, nb.angle * 0.35 + L * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.save();
                const coreA = 0.75 + Math.sin(frame * 0.018) * 0.2;
                ctx.globalAlpha = coreA;
                ctx.shadowColor = `hsl(${nb.hue},85%,75%)`;
                ctx.shadowBlur = 30;
                ctx.fillStyle = `hsl(${nb.hue + 20},70%,92%)`;
                ctx.beginPath();
                ctx.arc(cx + driftX * 0.2, cy + driftY * 0.2, 5.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                ctx.save();
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = `hsl(${nb.hue + 30},80%,85%)`;
                ctx.font = '11px Georgia';
                ctx.fillText(`Nebula ${ni + 1}`, cx + R * 0.52, cy + R * 0.28);
                ctx.fillText(nb.name.toUpperCase(), cx + R * 0.52, cy + R * 0.28 + 14);
                ctx.restore();
            }

            // ── Moon ───────────────────────────────────
            const showMoon = streak >= 365;
            s.moonA = showMoon
                ? Math.min(1, s.moonA + 0.006)
                : Math.max(0, s.moonA - 0.01);

            if (s.moonA > 0.01) {
                const MR = Math.min(W, H) * 0.118;
                const [mx, my] = toScreen(0.5, 0.20, 0.07, W, H, camX, camY);
                ctx.save();
                ctx.globalAlpha = s.moonA;

                for (let g = 5; g >= 0; g--) {
                    const rg = ctx.createRadialGradient(
                        mx, my, MR * (0.9 + g * 0.08),
                        mx, my, MR * (1.25 + g * 0.38)
                    );
                    rg.addColorStop(0, `rgba(185,200,235,${(0.055 - g * 0.007).toFixed(4)})`);
                    rg.addColorStop(1, 'rgba(185,200,235,0)');
                    ctx.fillStyle = rg;
                    ctx.beginPath();
                    ctx.arc(mx, my, MR * (1.8 + g * 0.4), 0, Math.PI * 2);
                    ctx.fill();
                }

                const mg = ctx.createRadialGradient(mx - MR * 0.24, my - MR * 0.20, 0, mx, my, MR);
                mg.addColorStop(0, '#e8e9f2');
                mg.addColorStop(0.30, '#c2c4d5');
                mg.addColorStop(0.68, '#9496b2');
                mg.addColorStop(1, '#52546a');
                ctx.fillStyle = mg;
                ctx.beginPath();
                ctx.arc(mx, my, MR, 0, Math.PI * 2);
                ctx.fill();

                for (const [dx, dy, cr] of CRATERS) {
                    ctx.save();
                    ctx.globalAlpha = 0.23;
                    ctx.fillStyle = '#484a60';
                    ctx.beginPath();
                    ctx.arc(mx + dx * MR, my + dy * MR, cr * MR, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 0.13;
                    ctx.fillStyle = '#cbcde0';
                    ctx.beginPath();
                    ctx.arc(mx + dx * MR - cr * MR * 0.22, my + dy * MR - cr * MR * 0.22, cr * MR * 0.55, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                const ts = ctx.createRadialGradient(mx + MR * 0.52, my, 0, mx, my, MR);
                ts.addColorStop(0.5, 'rgba(2,2,14,0)');
                ts.addColorStop(1, 'rgba(2,2,14,0.26)');
                ctx.fillStyle = ts;
                ctx.beginPath();
                ctx.arc(mx, my, MR, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }

            // ── Constellations ─────────────────────────
            for (const con of s.CONSTS) {
                con.alpha = Math.min(0.92, con.alpha + 0.003);
                const [ox, oy] = toScreen(con.gx, con.gy * 0.86, con.depth, W, H, camX, camY);

                ctx.save();
                ctx.globalAlpha = con.alpha * 0.42;
                ctx.strokeStyle = 'rgba(160,195,255,0.95)';
                ctx.lineWidth = 0.7;
                ctx.beginPath();
                con.pts.forEach(([px, py], i) => {
                    i === 0
                        ? ctx.moveTo(ox + px, oy + py)
                        : ctx.lineTo(ox + px, oy + py);
                });
                ctx.stroke();
                ctx.restore();

                for (const [px, py] of con.pts) {
                    const pulse = 0.78 + Math.sin(frame * 0.022 + px * 0.04 + py * 0.03) * 0.22;
                    drawStar(ctx, ox + px, oy + py, 3.2 * pulse, 1.4 * pulse, 4, [185, 210, 255], con.alpha * pulse);
                }

                ctx.save();
                ctx.globalAlpha = con.alpha * 0.62;
                ctx.fillStyle = 'rgba(195,215,255,1)';
                ctx.font = '10px Georgia';
                ctx.fillText(
                    `${con.num}. ${con.name.toUpperCase()}`,
                    ox + con.pts[0][0] - 4,
                    oy + con.pts[0][1] - 14
                );
                ctx.restore();
            }

            // ── Shooting stars ─────────────────────────
            for (const ss of s.SHOOTS) {
                const t = ((frame + ss.offset) % ss.period) / ss.period;
                if (t > 0.20) continue;
                const alpha = t < 0.03
                    ? t / 0.03
                    : Math.max(0, 1 - (t - 0.03) / 0.17);
                if (alpha < 0.02) continue;

                const dist = t * ss.period * ss.speed * 0.25;
                const [bx, by] = toScreen(ss.nx, ss.ny * 0.86, ss.depth, W, H, camX, camY);
                const sx = bx + Math.cos(ss.angle) * dist;
                const sy = by + Math.sin(ss.angle) * dist;

                if (sx < -20 || sx > W + 20 || sy < -20 || sy > H * 0.88 + 20) continue;

                ctx.save();
                ctx.globalAlpha = alpha * 0.94;

                const tg = ctx.createLinearGradient(
                    sx, sy,
                    sx - Math.cos(ss.angle) * ss.len,
                    sy - Math.sin(ss.angle) * ss.len
                );
                tg.addColorStop(0, `rgba(${ss.col[0]},${ss.col[1]},${ss.col[2]},1)`);
                tg.addColorStop(0.30, `rgba(${ss.col[0]},${ss.col[1]},${ss.col[2]},0.5)`);
                tg.addColorStop(1, `rgba(${ss.col[0]},${ss.col[1]},${ss.col[2]},0)`);
                ctx.strokeStyle = tg;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx - Math.cos(ss.angle) * ss.len, sy - Math.sin(ss.angle) * ss.len);
                ctx.stroke();

                ctx.shadowColor = `rgba(${ss.col[0]},${ss.col[1]},255,0.95)`;
                ctx.shadowBlur = 12;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(sx, sy, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // ── Stars ──────────────────────────────────
            const starCount = Math.min(streak, 365);
            for (let i = 0; i < starCount; i++) {
                const star = s.STARS[i];
                const t = frame * star.bspd + star.boff;
                const pulse = 0.70 + Math.sin(t) * 0.30;
                const [sx, sy] = toScreen(star.nx, star.ny, star.depth, W, H, camX, camY);

                if (sx < -15 || sx > W + 15 || sy < -15 || sy > H * 0.92 + 15) continue;

                const r = star.size * pulse;
                const spikes = star.size > 4.8 ? 6 : 4;
                drawStar(
                    ctx, sx, sy,
                    r, r * (spikes === 6 ? 0.36 : 0.42),
                    spikes, star.col, star.alpha * pulse
                );
            }

            // ── Ground ─────────────────────────────────
            const gY = H * 0.83;

            const gfade = ctx.createLinearGradient(0, gY - 50, 0, H);
            gfade.addColorStop(0, 'rgba(1,2,10,0)');
            gfade.addColorStop(0.2, 'rgba(1,2,10,0.5)');
            gfade.addColorStop(1, 'rgba(0,0,6,1)');
            ctx.fillStyle = gfade;
            ctx.fillRect(0, gY - 50, W, H - gY + 50);

            ctx.fillStyle = 'rgba(3,3,16,1)';
            ctx.beginPath();
            ctx.moveTo(0, H);
            const mpts = [
                [0, gY + 20], [W * .07, gY - 25], [W * .15, gY + 5],
                [W * .26, gY - 52], [W * .36, gY + 10], [W * .50, gY - 16],
                [W * .61, gY + 14], [W * .73, gY - 40], [W * .83, gY + 8],
                [W * .91, gY - 12], [W, gY - 6], [W, H]
            ];
            for (const [x, y] of mpts) ctx.lineTo(x, y);
            ctx.closePath();
            ctx.fill();

            for (let i = 0; i < 9; i++) {
                const rx = W * 0.28 + i * W * 0.052 + Math.sin(frame * 0.026 + i) * 5;
                ctx.save();
                ctx.globalAlpha = 0.05 + Math.sin(frame * 0.042 + i) * 0.035;
                ctx.fillStyle = '#a8bfe0';
                ctx.beginPath();
                ctx.ellipse(rx, H - 44, 11 + sr(i * 7) * 8, 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            ctx.fillStyle = 'rgba(2,2,14,1)';
            const drawTree = (tx, th) => {
                ctx.beginPath();
                ctx.moveTo(tx, H);
                ctx.lineTo(tx - 11, H - th * 0.38);
                ctx.lineTo(tx, H - th);
                ctx.lineTo(tx + 11, H - th * 0.38);
                ctx.closePath();
                ctx.fill();
            };
            for (let i = 0; i < 6; i++) drawTree(-2 + i * 24, 78 + sr(i * 31) * 36);
            for (let i = 0; i < 6; i++) drawTree(W + 2 - i * 24, 78 + sr(i * 53) * 36);

        },
    });

    // ── HUD ───────────────────────────────────────────
    const hud = useMemo(() => {
        const nS = Math.min(streak, 365);
        const nSh = Math.min(Math.floor(streak / 7), 52);
        const nC = Math.min(Math.floor(streak / 28), 12);
        const nN = Math.min(Math.floor(streak / 180), 2);

        let cur = MILESTONES[0];
        for (const m of MILESTONES) {
            if (streak >= m.d) cur = m;
        }
        const nxt = MILESTONES.find(m => streak < m.d);

        return { nS, nSh, nC, nN, cur, nxt };
    }, [streak]);

    const counters = [
        [hud.nS, 'Stars'],
        [hud.nSh, 'Shooting'],
        [hud.nC, 'Constellations'],
        [hud.nN, 'Nebulae'],
        [streak >= 365 ? '🌕' : '—', 'Moon']
    ];

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                background: '#000',
                overflow: 'hidden',
                pointerEvents: 'all',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.6s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh'
                }}
            />

            {/* Top bar */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20,
                padding: '10px 20px',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 100%)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                pointerEvents: 'none'
            }}>
                <div style={{ display: 'flex', gap: 18 }}>
                    {counters.map(([val, label]) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: 16, fontWeight: 'bold', color: '#fff',
                                textShadow: '0 0 10px rgba(150,180,255,.9)'
                            }}>
                                {val}
                            </div>
                            <div style={{
                                fontSize: 9, color: 'rgba(150,170,220,.65)',
                                letterSpacing: '.1em', textTransform: 'uppercase'
                            }}>
                                {label}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    style={{
                        pointerEvents: 'all',
                        cursor: 'pointer',
                        background: 'rgba(0,0,10,.55)',
                        border: '1px solid rgba(100,130,200,.25)',
                        borderRadius: 10,
                        padding: '6px 14px',
                        color: 'rgba(150,180,255,.8)',
                        fontSize: 13,
                        backdropFilter: 'blur(6px)',
                        fontFamily: 'Georgia, serif'
                    }}
                >
                    ✕ Close
                </button>
            </div>

            {/* Bottom HUD */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
                padding: '12px 22px',
                background: 'linear-gradient(0deg, rgba(0,0,0,.72) 0%, transparent 100%)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                pointerEvents: 'none'
            }}>
                <div>
                    <div style={{
                        fontSize: 22, fontWeight: 'bold', color: '#fff',
                        letterSpacing: '.07em',
                        textShadow: '0 0 18px rgba(150,180,255,.9)'
                    }}>
                        {streak} Day{streak !== 1 ? 's' : ''}
                    </div>
                    <div style={{
                        fontSize: 12, color: 'rgba(180,200,255,.75)', lineHeight: 1.75
                    }}>
                        {hud.cur.e} {hud.cur.l}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(120,150,200,.6)' }}>
                        {hud.nxt
                            ? `${hud.nxt.e} ${hud.nxt.l} in ${hud.nxt.d - streak} day${(hud.nxt.d - streak) !== 1 ? 's' : ''}`
                            : '✨ Full celestial sky achieved — 365 stars, 52 shooting stars, 12 constellations, 2 nebulae, moon'
                        }
                    </div>
                </div>
                <div style={{
                    textAlign: 'right', fontSize: 11,
                    color: 'rgba(120,150,200,.5)',
                    fontStyle: 'italic', lineHeight: 1.7
                }}>
                    Arrow keys · float through space<br />
                    Esc to close
                </div>
            </div>
        </div>
    );
};

Sky.isCanvasScene = true;

export default Sky;
