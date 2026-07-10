//C:\quran-similarity-app\frontend\src\shared\components\ImmersiveView\hooks\useCanvasScene.js
/**
 * useCanvasScene.js
 * ─────────────────────────────────────────────────────────────
 * Shared hook for ALL canvas-based immersive scenes.
 *
 * Eliminates 5× duplicated boilerplate:
 *   • body scroll-lock / restore
 *   • canvas resize (DPR-aware optional)
 *   • keyboard input (Escape closes, arrows feed keysRef)
 *   • touch pan (2-D, clamped)
 *   • rAF loop wiring
 *
 * Usage
 * ──────
 *   const { canvasRef, keysRef, camRef, frame } =
 *       useCanvasScene({ onClose, camMax: 120, useDpr: false, onTick });
 *
 *   // onTick(ctx, W, H, frame) is called every rAF — draw here.
 *   // camRef.current = { x, y } — updated by keyboard/touch.
 *
 * @param {object}   opts
 * @param {function} opts.onClose       - called on Escape / close button
 * @param {number}  [opts.camMax=120]   - camera translation clamp (pixels)
 * @param {number}  [opts.camSpd=3.0]   - keyboard camera speed per frame
 * @param {number}  [opts.camDamp=0.96] - inertia damping (0 = instant stop)
 * @param {boolean} [opts.useDpr=false] - multiply canvas size by devicePixelRatio
 * @param {function} opts.onTick        - (ctx, W, H, frame) → void
 */

import { useRef, useEffect, useState } from 'react';

const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

export default function useCanvasScene({
    onClose,
    camMax  = 120,
    camSpd  = 3.0,
    camDamp = 0.96,
    useDpr  = false,
    onTick,
}) {
    const canvasRef   = useRef(null);
    const keysRef     = useRef({});
    const camRef      = useRef({ x: 0, y: 0 });        // current camera offset
    const animIdRef   = useRef(null);
    const frameRef    = useRef(0);
    const onCloseRef  = useRef(onClose);
    const onTickRef   = useRef(onTick);
    const [visible, setVisible] = useState(false);

    // Keep refs current without re-running effects
    onCloseRef.current = onClose;
    onTickRef.current  = onTick;

    // ── 1. Body scroll-lock + fade-in ─────────────────────────
    useEffect(() => {
        const scrollY = window.scrollY;
        const body    = document.body;
        const prev    = {
            overflow : body.style.overflow,
            position : body.style.position,
            top      : body.style.top,
            width    : body.style.width,
        };
        body.style.overflow  = 'hidden';
        body.style.position  = 'fixed';
        body.style.top       = `-${scrollY}px`;
        body.style.width     = '100%';

        const tid = setTimeout(() => setVisible(true), 50);
        return () => {
            clearTimeout(tid);
            Object.assign(body.style, prev);
            window.scrollTo(0, scrollY);
        };
    }, []);

    // ── 2. Canvas resize ──────────────────────────────────────
    useEffect(() => {
        const resize = () => {
            const c = canvasRef.current;
            if (!c) return;
            const dpr = useDpr ? Math.min(window.devicePixelRatio || 1, 2) : 1;
            c.width  = Math.floor(window.innerWidth  * dpr);
            c.height = Math.floor(window.innerHeight * dpr);
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [useDpr]);

    // ── 3. Keyboard ───────────────────────────────────────────
    useEffect(() => {
        const NAV = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab'];
        const onDown = (e) => {
            if (NAV.includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
            if (e.key === 'Escape')  { e.preventDefault(); e.stopPropagation(); onCloseRef.current?.(); return; }
            keysRef.current[e.key] = true;
        };
        const onUp = (e) => {
            e.stopPropagation();
            delete keysRef.current[e.key];
        };
        const onBlur = () => { keysRef.current = {}; };  // clear on tab-away
        window.addEventListener('keydown', onDown, true);
        window.addEventListener('keyup',   onUp,   true);
        window.addEventListener('blur',    onBlur);
        return () => {
            window.removeEventListener('keydown', onDown, true);
            window.removeEventListener('keyup',   onUp,   true);
            window.removeEventListener('blur',    onBlur);
        };
    }, []);

    // ── 4. Touch pan ──────────────────────────────────────────
    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const touch = { active: false, sx: 0, sy: 0, scx: 0, scy: 0 };

        const onStart = (e) => {
            e.stopPropagation();
            const t   = e.touches[0];
            touch.active = true;
            touch.sx  = t.clientX; touch.sy  = t.clientY;
            touch.scx = camRef.current.x;
            touch.scy = camRef.current.y;
        };
        const onMove = (e) => {
            e.preventDefault(); e.stopPropagation();
            if (!touch.active) return;
            const t = e.touches[0];
            camRef.current.x = clamp(touch.scx - (t.clientX - touch.sx) * 0.45, -camMax, camMax);
            camRef.current.y = clamp(touch.scy - (t.clientY - touch.sy) * 0.45, -camMax, camMax);
        };
        const onEnd = (e) => { e.stopPropagation(); touch.active = false; };

        c.addEventListener('touchstart', onStart, { passive: true });
        c.addEventListener('touchmove',  onMove,  { passive: false });
        c.addEventListener('touchend',   onEnd,   { passive: true });
        return () => {
            c.removeEventListener('touchstart', onStart);
            c.removeEventListener('touchmove',  onMove);
            c.removeEventListener('touchend',   onEnd);
        };
    }, [camMax]);

    // ── 5. rAF loop ───────────────────────────────────────────
    useEffect(() => {
        const tick = () => {
            const c = canvasRef.current;
            if (!c || !c.width || !c.height) {
                animIdRef.current = requestAnimationFrame(tick);
                return;
            }
            const ctx = c.getContext('2d');
            const W   = c.width;
            const H   = c.height;
            const keys = keysRef.current;
            const cam  = camRef.current;

            // Apply keyboard → camera
            if (keys['ArrowLeft'])  cam.x = clamp(cam.x - camSpd, -camMax, camMax);
            if (keys['ArrowRight']) cam.x = clamp(cam.x + camSpd, -camMax, camMax);
            if (keys['ArrowUp'])    cam.y = clamp(cam.y - camSpd, -camMax, camMax);
            if (keys['ArrowDown'])  cam.y = clamp(cam.y + camSpd, -camMax, camMax);
            // Inertial damping when no key held
            if (!keys['ArrowLeft']  && !keys['ArrowRight']) cam.x *= camDamp;
            if (!keys['ArrowUp']    && !keys['ArrowDown'])  cam.y *= camDamp;

            frameRef.current++;
            onTickRef.current?.(ctx, W, H, frameRef.current);

            animIdRef.current = requestAnimationFrame(tick);
        };

        animIdRef.current = requestAnimationFrame(tick);
        return () => {
            if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
        };
    }, [camMax, camSpd, camDamp]);

    return { canvasRef, keysRef, camRef, frameRef, visible };
}
